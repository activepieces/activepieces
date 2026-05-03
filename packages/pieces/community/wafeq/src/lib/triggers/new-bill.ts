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

const polling: Polling<WafeqAuth, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const queryParams: Record<string, string> = { page_size: '100' };
    if (lastFetchEpochMS > 0) {
      queryParams['created_ts_after'] = new Date(
        lastFetchEpochMS
      ).toISOString();
    }
    const response = await wafeqApiCall<WafeqPaginatedResponse<BillItem>>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/bills/',
      queryParams,
    });
    return response.body.results.map((b) => ({
      epochMilliSeconds: new Date(b.created_ts).getTime(),
      data: flattenBill(b),
    }));
  },
};

export const newBill = createTrigger({
  auth: wafeqAuth,
  name: 'new_bill',
  displayName: 'New Bill',
  description:
    'Fires when a new bill from a supplier is created. Useful for approval workflows — e.g. post the new bill to a Slack channel for a manager to authorize.',
  props: {},
  sampleData: {
    id: 'bill_abc123',
    bill_number: 'SUP-2024-5001',
    contact_id: 'con_supplier',
    status: 'DRAFT',
    currency: 'AED',
    amount: 525,
    balance: 525,
    tax_amount: 25,
    bill_date: '2024-04-24',
    bill_due_date: '2024-05-24',
    reference: null,
    order_number: null,
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

function flattenBill(b: BillItem): Record<string, unknown> {
  return {
    id: b.id,
    bill_number: b.bill_number,
    contact_id: b.contact ?? null,
    status: b.status ?? null,
    currency: b.currency,
    amount: b.amount,
    balance: b.balance ?? null,
    tax_amount: b.tax_amount ?? null,
    bill_date: b.bill_date,
    bill_due_date: b.bill_due_date,
    reference: b.reference ?? null,
    order_number: b.order_number ?? null,
    external_id: b.external_id ?? null,
    created_ts: b.created_ts,
    modified_ts: b.modified_ts ?? null,
  };
}

type BillItem = {
  id: string;
  bill_number: string;
  contact?: string;
  status?: string;
  currency: string;
  amount: number;
  balance?: number;
  tax_amount?: number;
  bill_date: string;
  bill_due_date: string;
  reference?: string;
  order_number?: string;
  external_id?: string;
  created_ts: string;
  modified_ts?: string;
};
