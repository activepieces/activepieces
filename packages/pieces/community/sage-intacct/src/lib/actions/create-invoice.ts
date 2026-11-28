import { createAction } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient } from '../common/client';
import { sageIntacctRecords, sageIntacctSchemas } from '../common/output-schemas';
import { sageIntacctBodies, sageIntacctProps } from '../common/props';

export const createInvoiceAction = createAction({
  auth: sageIntacctAuth,
  name: 'create_invoice',
  displayName: 'Create Invoice',
  description: 'Create an AR invoice in Sage Intacct.',
  classification: 'WRITE',
  audience: 'human',
  props: {
    customer_key: sageIntacctProps.recordDropdown({
      object: sageIntacctRecords.CUSTOMER_OBJECT,
      displayName: 'Customer',
      description: 'The customer to invoice.',
    }),
    invoice_date: sageIntacctProps.dateProp({ displayName: 'Invoice Date', required: true }),
    due_date: sageIntacctProps.dateProp({ displayName: 'Due Date', required: true }),
    invoice_number: sageIntacctProps.text({ displayName: 'Invoice Number', description: 'Leave empty to let Sage Intacct number the invoice.' }),
    reference_number: sageIntacctProps.text({ displayName: 'Reference Number' }),
    description: sageIntacctProps.text({ displayName: 'Description' }),
    lines: sageIntacctProps.lineItemsProp(),
  },
  outputSchema: sageIntacctSchemas.invoice,
  async run(context) {
    const { customer_key, invoice_date, due_date, invoice_number, reference_number, description, lines } = context.propsValue;
    const key = sageIntacctBodies.recordKey(customer_key);
    if (!key) {
      throw new Error('Customer is required.');
    }
    const body = sageIntacctBodies.compact({
      customer: { key },
      invoiceDate: sageIntacctBodies.parseIsoDate({ value: invoice_date, label: 'Invoice Date' }),
      dueDate: sageIntacctBodies.parseIsoDate({ value: due_date, label: 'Due Date' }),
      invoiceNumber: sageIntacctBodies.trimmed(invoice_number),
      referenceNumber: sageIntacctBodies.trimmed(reference_number),
      description: sageIntacctBodies.trimmed(description),
      lines: sageIntacctBodies.parseLineItems({ value: lines, label: 'Lines', extraDimensions: { customer: { key } } }),
    });
    const record = await sageIntacctClient.createRecord({ auth: context.auth, object: sageIntacctRecords.INVOICE_OBJECT, body });
    return sageIntacctRecords.toInvoice(record);
  },
});
