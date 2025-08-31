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

    const whereClauses: string[] = [];
    if (contactId) whereClauses.push(`Contact.ContactID==guid("${contactId}")`);
    if (dateFrom) {
      const [y, m, d] = dateFrom.split('-');
      whereClauses.push(`Date>=DateTime(${y}, ${m}, ${d})`);
    }
    if (dateTo) {
      const [y, m, d] = dateTo.split('-');
      whereClauses.push(`Date<DateTime(${y}, ${m}, ${d})`);
    }
    if (Array.isArray(statuses) && statuses.length > 1) {
      whereClauses.push(`(${statuses.map((s) => `Status=="${s}"`).join(' OR ')})`);
    }

    const results: any[] = [];
    const maxPages = 5;
    for (let page = 1; page <= maxPages; page++) {
      const queryParams: Record<string, string> = {
        page: String(page),
        pageSize: String(pageSize),
        order: 'UpdatedDateUTC ASC',
      };
      if (whereClauses.length > 0) {
        queryParams['where'] = whereClauses.join(' AND ');
      }
      // Single status can use the dedicated param for efficiency
      if (Array.isArray(statuses) && statuses.length === 1) {
        queryParams['status'] = statuses[0];
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
        url: 'https://api.xero.com/api.xro/2.0/PurchaseOrders',
        headers,
        queryParams,
      });

      if (resp.status !== 200) break;

      const pos: any[] = resp.body?.PurchaseOrders ?? [];
      for (const po of pos) {
        const epoch = parseXeroDateToEpoch(po.UpdatedDateUTC || po.Date);
        results.push({ epochMilliSeconds: epoch, data: po });
      }

      if (pos.length < pageSize) break;
    }
    return results;
  },
};

export const xeroNewPurchaseOrder = createTrigger({
  auth: xeroAuth,
  name: 'xero_new_purchase_order',
  displayName: 'New Purchase Order',
  description: 'Fires when a new purchase order is created or enters a specific status for the first time.',
  props: {
    tenant_id: props.tenant_id,
    statuses: Property.StaticMultiSelectDropdown({
      displayName: 'Filter by Status (optional)',
      required: false,
      options: {
        options: [
          { label: 'DRAFT', value: 'DRAFT' },
          { label: 'SUBMITTED', value: 'SUBMITTED' },
          { label: 'AUTHORISED', value: 'AUTHORISED' },
          { label: 'BILLED', value: 'BILLED' },
          { label: 'DELETED', value: 'DELETED' },
        ],
      },
    }),
    first_time_status: Property.StaticDropdown({
      displayName: 'First-time Status (optional)',
      description: 'Also fire when a purchase order enters this status for the first time (since enabling).',
      required: false,
      options: {
        options: [
          { label: 'DRAFT', value: 'DRAFT' },
          { label: 'SUBMITTED', value: 'SUBMITTED' },
          { label: 'AUTHORISED', value: 'AUTHORISED' },
          { label: 'BILLED', value: 'BILLED' },
          { label: 'DELETED', value: 'DELETED' },
        ],
      },
    }),
    contact_id: props.contact_dropdown(false),
    date_from: Property.ShortText({ displayName: 'Date From (YYYY-MM-DD)', required: false }),
    date_to: Property.ShortText({ displayName: 'Date To (YYYY-MM-DD)', required: false }),
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
    const firstStatus: string | undefined = context.propsValue['first_time_status'];

    const seenIdsKey = `xero_po_seen_ids_${tenantId}`;
    const seenIds: string[] = (await context.store.get(seenIdsKey)) || [];

    const statusSeenKey = firstStatus ? `xero_po_status_seen_${tenantId}_${firstStatus}` : '';
    const statusSeenIds: string[] = firstStatus ? (await context.store.get(statusSeenKey)) || [] : [];

    const emittedIds = new Set<string>();
    const results: any[] = [];

    for (const po of items) {
      const id = po?.PurchaseOrderID;
      if (!id) continue;

      // Emit for brand new purchase orders (first time seen)
      if (!seenIds.includes(id)) {
        if (!emittedIds.has(id)) {
          results.push(po);
          emittedIds.add(id);
        }
        seenIds.push(id);
      }

      // Emit when entering the specific status for the first time
      if (firstStatus && po?.Status === firstStatus && !statusSeenIds.includes(id)) {
        if (!emittedIds.has(id)) {
          results.push(po);
          emittedIds.add(id);
        }
        statusSeenIds.push(id);
      }
    }

    await context.store.put(seenIdsKey, seenIds);
    if (firstStatus) {
      await context.store.put(statusSeenKey, statusSeenIds);
    }

    return results;
  },
  sampleData: undefined,
});


