import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { sageIntacctRecords, sageIntacctSchemas } from '../common/output-schemas';
import { sageIntacctPoll } from '../common/poll';

const STORE_KEY = 'sage_intacct_new_payment_received_state';

export const newPaymentReceivedTrigger = createTrigger({
  auth: sageIntacctAuth,
  name: 'new_payment_received',
  displayName: 'New Payment Received',
  description: 'Triggers when an AR payment is recorded in Sage Intacct.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once per AR payment recorded in Sage Intacct after the trigger is enabled, polling on the server-side creation timestamp; payments that existed before enabling are not replayed. The payload is the payment: key, id, paid date, payer name, payment method, document and reference numbers, state, customer id and name, total amount, currency and the created timestamp.',
  },
  type: TriggerStrategy.POLLING,
  props: {},
  outputSchema: sageIntacctSchemas.payment,
  sampleData: {
    key: '1412',
    id: '1412',
    paid_date: '2026-11-20',
    payer_name: 'Health Initiative 1',
    payment_method: 'printedCheck',
    document_number: null,
    reference_number: null,
    state: 'complete',
    description: null,
    customer_id: 'C-1001',
    customer_name: 'Health Initiative 1',
    total_amount: 2445.66,
    currency: 'USD',
    created_at: '2026-11-20T20:15:45Z',
  },
  async onEnable(context) {
    await sageIntacctPoll.enable({
      auth: context.auth,
      store: context.store,
      storeKey: STORE_KEY,
      isRepublish: context.isRepublish,
      object: sageIntacctRecords.PAYMENT_OBJECT,
    });
  },
  async onDisable() {
    await sageIntacctPoll.disable();
  },
  async test(context) {
    const records = await sageIntacctPoll.newestRecords({
      auth: context.auth,
      object: sageIntacctRecords.PAYMENT_OBJECT,
      fields: sageIntacctRecords.PAYMENT_QUERY_FIELDS,
    });
    return records.map((record) => sageIntacctRecords.toPayment(record));
  },
  async run(context) {
    const records = await sageIntacctPoll.pollNewRecords({
      auth: context.auth,
      store: context.store,
      storeKey: STORE_KEY,
      object: sageIntacctRecords.PAYMENT_OBJECT,
      fields: sageIntacctRecords.PAYMENT_QUERY_FIELDS,
    });
    return records.map((record) => sageIntacctRecords.toPayment(record));
  },
});
