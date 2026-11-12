import { createHash } from 'crypto';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { Store } from '@activepieces/pieces-framework';
import { XERO_URLS, xeroApi, xeroInput, xeroValue } from './client';

async function fetchUpdated({
  accessToken,
  tenantId,
  url,
  key,
  queryParams,
  lastFetchEpochMS,
  pageSize,
  paged = true,
}: FetchParams & { lastFetchEpochMS: number; pageSize: number; paged?: boolean }): Promise<Record<string, unknown>[]> {
  const records: Record<string, unknown>[] = [];
  for (let page = 1; ; page++) {
    const body = await xeroApi.request<unknown>({
      accessToken,
      tenantId,
      method: HttpMethod.GET,
      url,
      queryParams: {
        ...queryParams,
        ...(paged ? { page: String(page), pageSize: String(pageSize) } : {}),
        order: 'UpdatedDateUTC ASC',
      },
      headers: lastFetchEpochMS > 0 ? { 'If-Modified-Since': new Date(lastFetchEpochMS).toISOString().slice(0, 19) } : {},
      operation: `poll ${key}`,
    });
    const pageRecords = xeroApi.recordsOf({ body, key });
    records.push(...pageRecords);
    if (!paged || pageRecords.length < pageSize) return records;
    if (page < MAX_PAGES) continue;
    const older = withoutNewestInstant({ records });
    if (older.length > 0) return older;
    if (page >= MAX_SAME_INSTANT_PAGES) {
      throw new Error(
        `More than ${records.length} ${key} records share the same UpdatedDateUTC, so this poll cannot advance without skipping some. Raise Page Size (up to 1000) and publish again: the cursor is kept, so the next poll reads past them.`,
      );
    }
  }
}

function withoutNewestInstant({ records }: { records: Record<string, unknown>[] }): Record<string, unknown>[] {
  const newest = records.reduce((max, record) => Math.max(max, epochOf({ record })), Number.NEGATIVE_INFINITY);
  return records.filter((record) => epochOf({ record }) < newest);
}

function toItems({
  records,
  matches,
}: {
  records: Record<string, unknown>[];
  matches?: (record: Record<string, unknown>) => boolean;
}): { epochMilliSeconds: number; data: Record<string, unknown> | null }[] {
  return records.map((record) => ({ epochMilliSeconds: epochOf({ record }), data: matches === undefined || matches(record) ? record : null }));
}

function fingerprint({ propsValue }: { propsValue: Record<string, unknown> }): string {
  const sorted = Object.keys(propsValue)
    .filter((key) => !CURSOR_NEUTRAL_PROPS.includes(key))
    .sort()
    .map((key) => [key, propsValue[key]]);
  return createHash('sha256').update(JSON.stringify(sorted)).digest('hex').slice(0, 32);
}

async function keepStateOnRepublish({
  store,
  isRepublish,
  propsValue,
}: {
  store: Store;
  isRepublish: boolean | undefined;
  propsValue: Record<string, unknown>;
}): Promise<boolean> {
  const current = fingerprint({ propsValue });
  const previous = await store.get<unknown>(INPUTS_FINGERPRINT_KEY);
  await store.put(INPUTS_FINGERPRINT_KEY, current);
  const keep = isRepublish === true && (previous === null || previous === undefined || previous === current);
  if (!keep) await store.delete(LAST_POLL_KEY);
  return keep;
}

async function fetchRecent({ accessToken, tenantId, url, key, queryParams, paged = true }: FetchParams & { paged?: boolean }): Promise<Record<string, unknown>[]> {
  const body = await xeroApi.request<unknown>({
    accessToken,
    tenantId,
    method: HttpMethod.GET,
    url,
    queryParams: {
      ...queryParams,
      ...(paged ? { page: '1', pageSize: String(TEST_ITEM_LIMIT) } : {}),
      order: 'UpdatedDateUTC DESC',
    },
    operation: `load recent ${key}`,
  });
  return xeroApi.recordsOf({ body, key }).slice(0, TEST_ITEM_LIMIT);
}

function epochOf({ record }: { record: Record<string, unknown> }): number {
  return xeroValue.xeroDateToEpoch({ value: record['UpdatedDateUTC'] }) ?? xeroValue.xeroDateToEpoch({ value: record['Date'] }) ?? Date.now();
}

function pageSizeOf({ value, fallback, max }: { value: unknown; fallback: number; max: number }): number {
  if (value === undefined || value === null || value === '') return fallback;
  const size = Number(value);
  if (!Number.isInteger(size) || size < 1 || size > max) throw new Error(`Page Size must be a whole number from 1 to ${max}.`);
  return size;
}

function stringList({ value }: { value: unknown }): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0) : [];
}

function records({ items }: { items: unknown[] }): Record<string, unknown>[] {
  return items.filter(xeroValue.isRecord);
}

function idOf({ record, key }: { record: Record<string, unknown>; key: string }): string | undefined {
  return xeroValue.readString(record[key]);
}

function paymentRequest({
  accessToken,
  tenantId,
  paymentTypes,
  statuses,
  invoiceId,
  reference,
  dateFrom,
  dateTo,
}: {
  accessToken: string;
  tenantId: string;
  paymentTypes: unknown;
  statuses: unknown;
  invoiceId: unknown;
  reference: unknown;
  dateFrom: unknown;
  dateTo: unknown;
}) {
  const types = paymentTypes === undefined || paymentTypes === null ? ['ACCRECPAYMENT'] : stringList({ value: paymentTypes });
  const statusList = statuses === undefined || statuses === null ? ['AUTHORISED'] : stringList({ value: statuses });
  const invoice = xeroInput.trimmedOrUndefined({ value: invoiceId });
  const ref = xeroInput.trimmedOrUndefined({ value: reference });
  const from = xeroInput.parseDateInput({ value: dateFrom, field: 'Date From' });
  const to = xeroInput.parseDateInput({ value: dateTo, field: 'Date To' });
  const where = [
    ...anyOf({ field: 'PaymentType', values: types }),
    ...anyOf({ field: 'Status', values: statusList }),
    ...(invoice ? [`Invoice.InvoiceID==${xeroInput.whereGuid({ value: invoice, field: 'Invoice' })}`] : []),
    ...(ref ? [`Reference==${xeroInput.whereString({ value: ref })}`] : []),
    ...(from ? [`Date>=${xeroInput.whereDate({ value: from })}`] : []),
    ...(to ? [`Date<${xeroInput.whereDate({ value: to })}`] : []),
  ];
  return {
    accessToken,
    tenantId,
    url: `${XERO_URLS.api}/Payments`,
    key: 'Payments',
    queryParams: whereParams({ where }),
  };
}

function anyOf({ field, values }: { field: string; values: string[] }): string[] {
  if (values.length === 0) return [];
  if (values.length === 1) return [`${field}==${xeroInput.whereString({ value: values[0] })}`];
  return [`(${values.map((value) => `${field}==${xeroInput.whereString({ value })}`).join(' OR ')})`];
}

function quoteRequest({
  accessToken,
  tenantId,
  statuses,
  contactId,
  quoteNumber,
  dateFrom,
  dateTo,
  expiryDateFrom,
  expiryDateTo,
}: {
  accessToken: string;
  tenantId: string;
  statuses: unknown;
  contactId: unknown;
  quoteNumber: unknown;
  dateFrom: unknown;
  dateTo: unknown;
  expiryDateFrom: unknown;
  expiryDateTo: unknown;
}) {
  const statusList = stringList({ value: statuses });
  const contact = xeroInput.trimmedOrUndefined({ value: contactId });
  const number = xeroInput.trimmedOrUndefined({ value: quoteNumber });
  const params = {
    ...(statusList.length === 1 ? { Status: statusList[0] } : {}),
    ...(contact ? { ContactID: contact } : {}),
    ...(number ? { QuoteNumber: number } : {}),
    ...dateParam({ key: 'DateFrom', value: dateFrom, field: 'Date From' }),
    ...dateParam({ key: 'DateTo', value: dateTo, field: 'Date To' }),
    ...dateParam({ key: 'ExpiryDateFrom', value: expiryDateFrom, field: 'Expiry Date From' }),
    ...dateParam({ key: 'ExpiryDateTo', value: expiryDateTo, field: 'Expiry Date To' }),
  };
  return {
    request: { accessToken, tenantId, url: `${XERO_URLS.api}/Quotes`, key: 'Quotes', queryParams: params },
    matches: (record: Record<string, unknown>) => statusList.length <= 1 || statusList.includes(String(record['Status'])),
  };
}

function dateParam({ key, value, field }: { key: string; value: unknown; field: string }): Record<string, string> {
  const date = xeroInput.parseDateInput({ value, field });
  return date ? { [key]: date } : {};
}

function whereParams({ where }: { where: string[] }): QueryParams {
  return where.length > 0 ? { where: where.join(' AND ') } : {};
}

const MAX_PAGES = 5;
const MAX_SAME_INSTANT_PAGES = 50;
const CURSOR_NEUTRAL_PROPS = ['page_size'];
const INPUTS_FINGERPRINT_KEY = 'xero_trigger_inputs_fingerprint';
const LAST_POLL_KEY = 'lastPoll';

export const TEST_ITEM_LIMIT = 5;

export const xeroPolling = {
  whereParams,
  fetchUpdated,
  fetchRecent,
  toItems,
  fingerprint,
  keepStateOnRepublish,
  epochOf,
  pageSizeOf,
  stringList,
  records,
  idOf,
  anyOf,
  paymentRequest,
  quoteRequest,
};

type FetchParams = {
  accessToken: string;
  tenantId: string;
  url: string;
  key: string;
  queryParams: QueryParams;
};
