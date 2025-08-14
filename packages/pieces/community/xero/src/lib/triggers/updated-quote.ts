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
    const quoteNumber = propsValue?.['quote_number'] as string | undefined;
    const dateFrom = propsValue?.['date_from'] as string | undefined;
    const dateTo = propsValue?.['date_to'] as string | undefined;
    const expiryFrom = propsValue?.['expiry_date_from'] as string | undefined;
    const expiryTo = propsValue?.['expiry_date_to'] as string | undefined;

    const results: any[] = [];
    const maxPages = 5;
    for (let page = 1; page <= maxPages; page++) {
      const queryParams: Record<string, string> = {
        page: String(page),
        pageSize: String(pageSize),
        order: 'UpdatedDateUTC ASC',
      };
      if (Array.isArray(statuses) && statuses.length === 1) {
        queryParams['status'] = statuses[0];
      }
      if (contactId) queryParams['ContactID'] = contactId;
      if (quoteNumber) queryParams['QuoteNumber'] = quoteNumber;
      if (dateFrom) queryParams['DateFrom'] = dateFrom;
      if (dateTo) queryParams['DateTo'] = dateTo;
      if (expiryFrom) queryParams['ExpiryDateFrom'] = expiryFrom;
      if (expiryTo) queryParams['ExpiryDateTo'] = expiryTo;

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
        url: 'https://api.xero.com/api.xro/2.0/Quotes',
        headers,
        queryParams,
      });

      if (resp.status !== 200) break;

      const quotes: any[] = resp.body?.Quotes ?? [];
      for (const q of quotes) {
        const epoch = parseXeroDateToEpoch(q.UpdatedDateUTC || q.Date);
        results.push({ epochMilliSeconds: epoch, data: q });
      }

      if (quotes.length < pageSize) break;
    }
    return results;
  },
};

export const xeroUpdatedQuote = createTrigger({
  auth: xeroAuth,
  name: 'xero_updated_quote',
  displayName: 'Updated Quote',
  description: 'Fires when a quote is created or updated.',
  props: {
    tenant_id: props.tenant_id,
    statuses: Property.StaticMultiSelectDropdown({
      displayName: 'Filter by Status (optional)',
      required: false,
      options: {
        options: [
          { label: 'DRAFT', value: 'DRAFT' },
          { label: 'SENT', value: 'SENT' },
          { label: 'ACCEPTED', value: 'ACCEPTED' },
          { label: 'DECLINED', value: 'DECLINED' },
          { label: 'INVOICED', value: 'INVOICED' },
          { label: 'DELETED', value: 'DELETED' },
        ],
      },
    }),
    contact_id: props.contact_dropdown(false),
    quote_number: Property.ShortText({ displayName: 'Quote Number (partial match)', required: false }),
    date_from: Property.ShortText({ displayName: 'Date From (YYYY-MM-DD)', required: false }),
    date_to: Property.ShortText({ displayName: 'Date To (YYYY-MM-DD)', required: false }),
    expiry_date_from: Property.ShortText({ displayName: 'Expiry Date From (YYYY-MM-DD)', required: false }),
    expiry_date_to: Property.ShortText({ displayName: 'Expiry Date To (YYYY-MM-DD)', required: false }),
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

    const prevMapKey = `xero_quote_prev_updated_${tenantId}`;
    const prevMap: Record<string, number> = (await context.store.get(prevMapKey)) || {};

    const results: any[] = [];
    for (const q of items) {
      const id = q?.QuoteID as string | undefined;
      if (!id) continue;
      const updatedEpoch = parseXeroDateToEpoch(q?.UpdatedDateUTC || q?.Date);
      const prevEpoch = prevMap[id] || 0;
      if (updatedEpoch > prevEpoch) {
        results.push(q);
        prevMap[id] = updatedEpoch;
      }
    }

    await context.store.put(prevMapKey, prevMap);
    return results;
  },
  sampleData: undefined,
});


