import { createAction } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient } from '../common/client';
import { sageIntacctRecords, sageIntacctSchemas } from '../common/output-schemas';
import { sageIntacctBodies, sageIntacctProps } from '../common/props';

export const updateInvoiceAction = createAction({
  auth: sageIntacctAuth,
  name: 'update_invoice',
  displayName: 'Update Invoice',
  description: 'Update header fields on an existing AR invoice. Empty fields are left unchanged; lines are not changed.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates header fields on an existing Sage Intacct AR invoice with PATCH, sending only the fields you fill; empty fields keep their current values. invoice_key is the invoice record key (from Find Invoice or the New Invoice trigger), not the invoice number. Fields: invoice_date and due_date (strict YYYY-MM-DD), invoice_number, reference_number, description. Lines cannot be changed here. Returns the saved invoice. Idempotent: repeating the same update leaves the same values.',
    idempotent: true,
  },
  props: {
    invoice_key: sageIntacctProps.recordDropdown({
      object: sageIntacctRecords.INVOICE_OBJECT,
      displayName: 'Invoice',
      description: 'The invoice to update. In an agent, pass the invoice record key.',
      labelPaths: ['invoiceNumber', 'customer.name'],
      orderBy: [{ key: 'desc' }],
      searchPaths: ['invoiceNumber', 'customer.name'],
    }),
    invoice_date: sageIntacctProps.dateProp({ displayName: 'Invoice Date', required: false }),
    due_date: sageIntacctProps.dateProp({ displayName: 'Due Date', required: false }),
    invoice_number: sageIntacctProps.text({ displayName: 'Invoice Number' }),
    reference_number: sageIntacctProps.text({ displayName: 'Reference Number' }),
    description: sageIntacctProps.text({ displayName: 'Description' }),
  },
  outputSchema: sageIntacctSchemas.invoice,
  async run(context) {
    const { invoice_key, invoice_date, due_date, invoice_number, reference_number, description } = context.propsValue;
    const key = sageIntacctBodies.recordKey(invoice_key);
    if (!key) {
      throw new Error('Invoice is required.');
    }
    const body = sageIntacctBodies.compact({
      invoiceDate: sageIntacctBodies.parseIsoDate({ value: invoice_date, label: 'Invoice Date' }),
      dueDate: sageIntacctBodies.parseIsoDate({ value: due_date, label: 'Due Date' }),
      invoiceNumber: sageIntacctBodies.trimmed(invoice_number),
      referenceNumber: sageIntacctBodies.trimmed(reference_number),
      description: sageIntacctBodies.trimmed(description),
    });
    if (Object.keys(body).length === 0) {
      throw new Error('Fill at least one field to update.');
    }
    const record = await sageIntacctClient.updateRecord({ auth: context.auth, object: sageIntacctRecords.INVOICE_OBJECT, key, body });
    return sageIntacctRecords.toInvoice(record);
  },
});
