import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { sageIntacctRecords, sageIntacctSchemas } from '../common/output-schemas';
import { sageIntacctPoll } from '../common/poll';

const STORE_KEY = 'sage_intacct_new_ar_invoice_state';

export const newArInvoiceTrigger = createTrigger({
  auth: sageIntacctAuth,
  name: 'new_ar_invoice',
  displayName: 'New Invoice',
  description: 'Triggers when an AR invoice is created in Sage Intacct.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once per AR invoice created in Sage Intacct after the trigger is enabled, polling on the server-side creation timestamp; invoices that existed before enabling are not replayed. The payload is the invoice: key (record number), invoice number, state, invoice and due dates, description, customer id and name, total and due amounts, currency and created/modified timestamps.',
  },
  type: TriggerStrategy.POLLING,
  props: {},
  outputSchema: sageIntacctSchemas.invoice,
  sampleData: {
    key: '1445',
    id: '1445',
    invoice_number: 'AR_Inv-00079',
    state: 'posted',
    invoice_date: '2026-11-20',
    due_date: '2026-12-20',
    description: 'Monthly services',
    reference_number: null,
    customer_id: 'C-1021',
    customer_name: 'Resource Network',
    total_amount: 1200.5,
    total_due: 1200.5,
    currency: 'USD',
    created_at: '2026-11-20T14:10:53Z',
    modified_at: '2026-11-20T14:10:53Z',
  },
  async onEnable(context) {
    await sageIntacctPoll.enable({
      auth: context.auth,
      store: context.store,
      storeKey: STORE_KEY,
      isRepublish: context.isRepublish,
      object: sageIntacctRecords.INVOICE_OBJECT,
    });
  },
  async onDisable() {
    await sageIntacctPoll.disable();
  },
  async test(context) {
    const records = await sageIntacctPoll.newestRecords({
      auth: context.auth,
      object: sageIntacctRecords.INVOICE_OBJECT,
      fields: sageIntacctRecords.INVOICE_QUERY_FIELDS,
    });
    return records.map((record) => sageIntacctRecords.toInvoice(record));
  },
  async run(context) {
    const records = await sageIntacctPoll.pollNewRecords({
      auth: context.auth,
      store: context.store,
      storeKey: STORE_KEY,
      object: sageIntacctRecords.INVOICE_OBJECT,
      fields: sageIntacctRecords.INVOICE_QUERY_FIELDS,
    });
    return records.map((record) => sageIntacctRecords.toInvoice(record));
  },
});
