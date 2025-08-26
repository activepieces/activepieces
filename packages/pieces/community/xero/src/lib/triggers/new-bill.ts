import {
  TriggerStrategy,
  createTrigger,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import { xeroAuth } from '../..';
import {
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { props } from '../common/props';

function parseXeroDateToEpoch(dateVal: unknown): number {
  if (typeof dateVal === 'string') {
    if (dateVal.includes('/Date(')) {
      const match = /\/Date\((\d+)/.exec(dateVal);
      if (match && match[1]) return Number(match[1]);
    }
    const t = Date.parse(dateVal);
    if (!Number.isNaN(t)) return t;
  }
  if (typeof dateVal === 'number') return dateVal;
  return Date.now();
}

const polling: Polling<
  PiecePropValueSchema<typeof xeroAuth>,
  Record<string, unknown>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS, propsValue }) {
    const { access_token } = auth;
    const tenantId = propsValue?.['tenant_id'] as string;
    const pageSize = (propsValue?.['page_size'] as number) || 200;
    const statuses = (propsValue?.['statuses'] as string[]) || [];
    const contactId = propsValue?.['contact_id'] as string | undefined;
    const dateFrom = propsValue?.['date_from'] as string | undefined;
    const dateTo = propsValue?.['date_to'] as string | undefined;
    const summaryOnly = Boolean(propsValue?.['summary_only']);

    const results: any[] = [];
    const maxPages = 5;
    for (let page = 1; page <= maxPages; page++) {
      const queryParams: Record<string, string> = {
        page: String(page),
        pageSize: String(pageSize),
        order: 'UpdatedDateUTC ASC',
      };

      if (Array.isArray(statuses) && statuses.length > 0) {
        queryParams['Statuses'] = statuses.join(',');
      }
      if (contactId) {
        queryParams['ContactIDs'] = contactId;
      }
      if (summaryOnly) {
        queryParams['summaryOnly'] = 'true';
      }

      const whereClauses: string[] = ['Type=="ACCPAY"'];
      if (dateFrom) {
        const [y, m, d] = dateFrom.split('-');
        whereClauses.push(`Date>=DateTime(${y}, ${m}, ${d})`);
      }
      if (dateTo) {
        const [y, m, d] = dateTo.split('-');
        whereClauses.push(`Date<DateTime(${y}, ${m}, ${d})`);
      }
      if (whereClauses.length > 0) {
        queryParams['where'] = whereClauses.join(' AND ');
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/json',
        'Xero-Tenant-Id': tenantId,
      };
      if (lastFetchEpochMS > 0) {
        const ifModified = new Date(lastFetchEpochMS).toISOString().slice(0, 19);
        headers['If-Modified-Since'] = ifModified;
      }

      const resp = await httpClient.sendRequest<Record<string, any>>({
        method: HttpMethod.GET,
        url: 'https://api.xero.com/api.xro/2.0/Invoices',
        headers,
        queryParams,
      });

      if (resp.status !== 200) break;

      const invoices: any[] = resp.body?.Invoices ?? [];
      for (const inv of invoices) {
        if (inv?.Type !== 'ACCPAY') continue;
        const epoch = parseXeroDateToEpoch(inv.UpdatedDateUTC || inv.Date);
        results.push({ epochMilliSeconds: epoch, data: inv });
      }

      if (invoices.length < pageSize) break;
    }
    return results;
  },
};

export const xeroNewBill = createTrigger({
  auth: xeroAuth,
  name: 'xero_new_bill',
  displayName: 'New Bill',
  description: 'Fires when a new bill (Accounts Payable) is added.',
  props: {
    tenant_id: props.tenant_id,
    statuses: Property.StaticMultiSelectDropdown({
      displayName: 'Statuses (optional)',
      required: false,
      options: {
        options: [
          { label: 'DRAFT', value: 'DRAFT' },
          { label: 'SUBMITTED', value: 'SUBMITTED' },
          { label: 'AUTHORISED', value: 'AUTHORISED' },
          { label: 'PAID', value: 'PAID' },
          { label: 'VOIDED', value: 'VOIDED' },
          { label: 'DELETED', value: 'DELETED' },
        ],
      },
    }),
    contact_id: props.contact_dropdown(false),
    date_from: Property.ShortText({ displayName: 'Date From (YYYY-MM-DD)', required: false }),
    date_to: Property.ShortText({ displayName: 'Date To (YYYY-MM-DD)', required: false }),
    summary_only: Property.Checkbox({ displayName: 'Summary Only (lighter, faster)', required: false, defaultValue: true }),
    page_size: Property.Number({ displayName: 'Page Size (1-1000)', required: false }),
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context: any) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context: any) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async test(context: any) {
    return await pollingHelper.test(polling, context);
  },
  async run(context: any) {
    const items = (await pollingHelper.poll(polling, context)) as any[];
    const tenantId = context.propsValue['tenant_id'];
    const seenKey = `xero_bill_seen_ids_${tenantId}`;
    const seen: string[] = (await context.store.get(seenKey)) || [];

    const results: any[] = [];
    for (const inv of items) {
      const id = inv?.InvoiceID as string | undefined;
      if (!id) continue;
      if (!seen.includes(id)) {
        results.push(inv);
        seen.push(id);
      }
    }
    await context.store.put(seenKey, seen);
    return results;
  },
  sampleData: undefined,
});


