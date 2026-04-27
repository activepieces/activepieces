import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
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
    const response = await wafeqApiCall<WafeqPaginatedResponse<PaymentItem>>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/payments/',
      queryParams,
    });
    return response.body.results.map((p) => ({
      epochMilliSeconds: new Date(p.created_ts).getTime(),
      data: flattenPayment(p),
    }));
  },
};

export const newPaymentReceived = createTrigger({
  auth: wafeqAuth,
  name: 'new_payment_received',
  displayName: 'New Payment Received',
  description:
    'Fires every time a payment is recorded in Wafeq. Great for celebrating revenue in Slack, triggering commission calculations, or sending the customer a receipt.',
  props: {},
  sampleData: {
    id: 'pay_abc123',
    amount: 1050,
    currency: 'AED',
    date: '2024-04-24',
    contact_id: 'con_xyz789',
    paid_through_account_id: 'acc_bank_main',
    payment_fees: null,
    reference: 'Stripe ch_xxx',
    external_id: null,
    invoice_payments_count: 1,
    bill_payments_count: 0,
    credit_note_payments_count: 0,
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

function flattenPayment(p: PaymentItem): Record<string, unknown> {
  return {
    id: p.id,
    amount: p.amount,
    currency: p.currency,
    date: p.date,
    contact_id: p.contact ?? null,
    paid_through_account_id: p.paid_through_account,
    payment_fees: p.payment_fees ?? null,
    reference: p.reference ?? null,
    external_id: p.external_id ?? null,
    invoice_payments_count: Array.isArray(p.invoice_payments)
      ? p.invoice_payments.length
      : 0,
    bill_payments_count: Array.isArray(p.bill_payments)
      ? p.bill_payments.length
      : 0,
    credit_note_payments_count: Array.isArray(p.credit_note_payments)
      ? p.credit_note_payments.length
      : 0,
    created_ts: p.created_ts,
    modified_ts: p.modified_ts ?? null,
  };
}

type PaymentItem = {
  id: string;
  amount: number;
  currency: string;
  date: string;
  contact?: string;
  paid_through_account: string;
  payment_fees?: number;
  reference?: string;
  external_id?: string;
  invoice_payments?: unknown[];
  bill_payments?: unknown[];
  credit_note_payments?: unknown[];
  created_ts: string;
  modified_ts?: string;
};
