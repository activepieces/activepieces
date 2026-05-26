import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import { WafeqAuth, wafeqAuth } from '../common/auth';
import { wafeqApiCall, WafeqPaginatedResponse } from '../common/client';

const polling: Polling<WafeqAuth,Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const queryParams: Record<string, string> = {
      page_size: '100',
    };
    if (lastFetchEpochMS > 0) {
      queryParams['created_ts_after'] = new Date(lastFetchEpochMS).toISOString();
    }
    const response = await wafeqApiCall<WafeqPaginatedResponse<InvoiceItem>>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/invoices/',
      queryParams,
    });
    return response.body.results.map((inv) => ({
      epochMilliSeconds: new Date(inv.created_ts).getTime(),
      data: flattenInvoice(inv),
    }));
  },
};

export const newInvoice = createTrigger({
  auth: wafeqAuth,
  name: 'new_invoice',
  displayName: 'New Invoice',
  description:
    'Fires every time a new invoice is created in Wafeq. Useful for logging sales to a spreadsheet, posting to Slack, or syncing to another system.',
  props: {},
  sampleData: {
    id: 'inv_abc123',
    invoice_number: 'INV-2024-001',
    contact_id: 'con_xyz789',
    status: 'DRAFT',
    currency: 'AED',
    amount: 1050,
    balance: 1050,
    tax_amount: 50,
    invoice_date: '2024-04-24',
    invoice_due_date: '2024-05-24',
    reference: null,
    external_id: null,
    created_ts: '2024-04-24T10:15:00Z',
    modified_ts: '2024-04-24T10:15:00Z',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});

function flattenInvoice(inv: InvoiceItem): Record<string, unknown> {
  return {
    id: inv.id,
    invoice_number: inv.invoice_number,
    contact_id: inv.contact ?? null,
    status: inv.status ?? null,
    currency: inv.currency,
    amount: inv.amount,
    balance: inv.balance ?? null,
    tax_amount: inv.tax_amount ?? null,
    invoice_date: inv.invoice_date,
    invoice_due_date: inv.invoice_due_date,
    reference: inv.reference ?? null,
    external_id: inv.external_id ?? null,
    created_ts: inv.created_ts,
    modified_ts: inv.modified_ts ?? null,
  };
}

type InvoiceItem = {
  id: string;
  invoice_number: string;
  contact?: string;
  status?: string;
  currency: string;
  amount: number;
  balance?: number;
  tax_amount?: number;
  invoice_date: string;
  invoice_due_date: string;
  reference?: string;
  external_id?: string;
  created_ts: string;
  modified_ts?: string;
};
