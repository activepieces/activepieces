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
    const paymentTypes = (propsValue?.['payment_types'] as string[]) || ['ACCRECPAYMENT'];
    const statuses = (propsValue?.['statuses'] as string[]) || ['AUTHORISED'];
    const invoiceId = propsValue?.['invoice_id'] as string | undefined;
    const reference = propsValue?.['reference'] as string | undefined;
    const dateFrom = propsValue?.['date_from'] as string | undefined;
    const dateTo = propsValue?.['date_to'] as string | undefined;

    const whereClauses: string[] = [];
    if (paymentTypes.length === 1) whereClauses.push(`PaymentType=="${paymentTypes[0]}"`);
    if (paymentTypes.length > 1)
      whereClauses.push(`(${paymentTypes.map((t) => `PaymentType=="${t}"`).join(' OR ')})`);
    if (statuses.length === 1) whereClauses.push(`Status=="${statuses[0]}"`);
    if (statuses.length > 1) whereClauses.push(`(${statuses.map((s) => `Status=="${s}"`).join(' OR ')})`);
    if (invoiceId) whereClauses.push(`Invoice.InvoiceID==guid("${invoiceId}")`);
    if (reference) whereClauses.push(`Reference=="${reference.replace(/"/g, '\\"')}"`);
    if (dateFrom) {
      const [y, m, d] = dateFrom.split('-');
      whereClauses.push(`Date>=DateTime(${y}, ${m}, ${d})`);
    }
    if (dateTo) {
      const [y, m, d] = dateTo.split('-');
      whereClauses.push(`Date<DateTime(${y}, ${m}, ${d})`);
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

      const requestHeaders: Record<string, string> = {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/json',
        'Xero-Tenant-Id': tenantId,
      };
      if (lastFetchEpochMS > 0) {
        const ifModified = new Date(lastFetchEpochMS).toISOString().slice(0, 19);
        requestHeaders['If-Modified-Since'] = ifModified;
      }

      const resp = await httpClient.sendRequest<Record<string, any>>({
        method: HttpMethod.GET,
        url: 'https://api.xero.com/api.xro/2.0/Payments',
        headers: requestHeaders,
        queryParams,
      });

      if (resp.status !== 200) break;

      const items: any[] = resp.body?.Payments ?? [];
      for (const p of items) {
        const epoch = parseXeroDateToEpoch(p.UpdatedDateUTC || p.Date);
        results.push({ epochMilliSeconds: epoch, data: p });
      }

      if (items.length < pageSize) break;
    }

    return results;
  },
};

export const xeroNewReconciledPayment = createTrigger({
  auth: xeroAuth,
  name: 'xero_new_reconciled_payment',
  displayName: 'New Reconciled Payment',
  description: 'Fires when a payment is reconciled for the first time.',
  props: {
    tenant_id: props.tenant_id,
    payment_types: Property.StaticMultiSelectDropdown({
      displayName: 'Payment Types',
      required: false,
      options: {
        options: [
          { label: 'ACCRECPAYMENT (Received on Sales Invoice)', value: 'ACCRECPAYMENT' },
          { label: 'ACCPAYPAYMENT (Paid on Bill)', value: 'ACCPAYPAYMENT' },
        ],
      },
      defaultValue: ['ACCRECPAYMENT'],
    }),
    statuses: Property.StaticMultiSelectDropdown({
      displayName: 'Statuses',
      required: false,
      options: { options: [
        { label: 'AUTHORISED', value: 'AUTHORISED' },
        { label: 'DELETED', value: 'DELETED' },
      ]},
      defaultValue: ['AUTHORISED'],
    }),
    invoice_id: props.invoice_id(false),
    reference: Property.ShortText({ displayName: 'Reference', required: false }),
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
    const seenKey = `xero_payment_reconciled_seen_ids_${tenantId}`;
    const seen: string[] = (await context.store.get(seenKey)) || [];

    const previousStateKey = `xero_payment_prev_reconciled_state_${tenantId}`;
    const prevState: Record<string, boolean> = (await context.store.get(previousStateKey)) || {};

    const results: any[] = [];
    for (const p of items) {
      const id = p?.PaymentID as string | undefined;
      if (!id) continue;

      const isRec = Boolean(p?.IsReconciled);
      const wasRec = Boolean(prevState[id]);

      // Fire only when first transitions to reconciled (false -> true)
      if (isRec && !wasRec && !seen.includes(id)) {
        results.push(p);
        seen.push(id);
      }

      // Track current state for next poll
      prevState[id] = isRec;
    }

    await context.store.put(seenKey, seen);
    await context.store.put(previousStateKey, prevState);
    return results;
  },
  sampleData: undefined,
});


