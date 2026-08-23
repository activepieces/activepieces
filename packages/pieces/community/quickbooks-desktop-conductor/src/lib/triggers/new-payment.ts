import { createTrigger, TriggerStrategy, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { quickbooksDesktopConductorAuth } from '../auth';
import { ConductorAuth } from '../common/client';
import { fetchAllUpdatedSince } from '../common/polling';
import { ConductorPaymentResult, flattenPayment } from '../common/payments';
import { newPaymentTriggerOutputSchema } from '../output-schemas';

const polling: Polling<AppConnectionValueForAuthProperty<typeof quickbooksDesktopConductorAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const conductorAuth: ConductorAuth = { secretKey: auth.props.secretKey, endUserId: auth.props.endUserId };
    // This trigger is create-only (the invoice one is create-or-update). Conductor only offers
    // `updatedAfter`, not `createdAfter`, so we fetch broad and dedupe narrow: query by
    // `updatedAfter`, then key each item's epoch on its own `createdAt`. Since `updatedAt` is
    // always >= `createdAt`, that query can never miss a genuinely new payment — it just also pulls
    // in old payments that were merely edited, which pollingHelper then filters out by their old
    // `createdAt`. A bit of wasted fetching, but there's no cheaper way to ask Conductor directly.
    const payments = await fetchAllUpdatedSince<ConductorPaymentResult>({
      auth: conductorAuth,
      resourceUri: '/quickbooks-desktop/receive-payments',
      updatedAfterEpochMS: lastFetchEpochMS,
    });
    return payments.map((payment) => ({
      epochMilliSeconds: new Date(payment.createdAt).getTime(),
      data: flattenPayment({ payment, paymentType: 'customer_payment' }),
    }));
  },
};

export const newPaymentTrigger = createTrigger({
  auth: quickbooksDesktopConductorAuth,
  name: 'new_payment',
  displayName: 'New Payment',
  description: 'Fires once when a new customer payment is recorded (Accounts Receivable) in QuickBooks Desktop — a "Receive Payment" transaction, e.g. from the Record Payment action\'s Customer Payment mode. Create-only: editing an existing payment does not re-fire it. Vendor bill payments (Accounts Payable) do not fire this trigger.',
  aiMetadata: {
    description: 'Fires when a new customer payment is recorded in QuickBooks Desktop (Accounts Receivable — "Receive Payment"), emitting the payment record. Create-only — later edits to that same payment do not fire it again. Scoped to customer payments only — vendor bill payments (Accounts Payable) are not covered. Polls every ~5 minutes; if the QuickBooks Desktop machine is off or asleep at poll time, the poll fails visibly (Conductor returns a connection error) rather than silently returning zero results.',
  },
  props: {},
  type: TriggerStrategy.POLLING,
  outputSchema: newPaymentTriggerOutputSchema,
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  sampleData: {
    id: '2FC2E-1797340229',
    payment_type: 'customer_payment',
    transaction_date: '2026-08-20',
    ref_number: 'SUITEPMT1',
    memo: 'full suite test',
    amount: '270.00',
    customer_id: '800000EA-1797339907',
    customer_name: 'Suite Test Customer',
    vendor_id: null,
    vendor_name: null,
    revision_number: '1797340229',
    created_at: '2026-12-15T16:10:29+03:00',
    updated_at: '2026-12-15T16:10:29+03:00',
  },
});
