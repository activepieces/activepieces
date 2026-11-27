import { createAction, Property } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient } from '../common/client';
import { sageIntacctRecords, sageIntacctSchemas } from '../common/output-schemas';
import { sageIntacctBodies } from '../common/props';

export const createInvoiceAiAction = createAction({
  auth: sageIntacctAuth,
  name: 'create_invoice_ai',
  displayName: 'Create Invoice (AI)',
  description: 'Create an AR invoice in Sage Intacct from plain fields and a JSON line list.',
  classification: 'WRITE',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates an AR invoice in Sage Intacct. customer_id is the customer ID (for example "C-1001", from Find Customer). invoice_date and due_date are strict YYYY-MM-DD dates. lines is a JSON array where each entry is {"gl_account_id": "<GL account ID from List GL Accounts>", "amount": <non-zero number>, "memo": "<optional>", "location_id": "<optional>", "department_id": "<optional>"}. Many companies require location_id on income accounts (error "requires a Site"); get IDs from List Locations. invoice_number is optional; leave it out to let Sage Intacct number the invoice. Returns the saved invoice with its key (record number), totals and state. Not idempotent: a repeat call creates another invoice.',
    idempotent: false,
  },
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The customer ID, for example C-1001.',
      required: true,
    }),
    invoice_date: Property.ShortText({ displayName: 'Invoice Date', description: 'YYYY-MM-DD', required: true }),
    due_date: Property.ShortText({ displayName: 'Due Date', description: 'YYYY-MM-DD', required: true }),
    invoice_number: Property.ShortText({ displayName: 'Invoice Number', required: false }),
    reference_number: Property.ShortText({ displayName: 'Reference Number', required: false }),
    description: Property.ShortText({ displayName: 'Description', required: false }),
    lines: Property.Json({
      displayName: 'Lines',
      description: 'JSON array of lines; each needs gl_account_id and a non-zero amount.',
      required: true,
    }),
  },
  outputSchema: sageIntacctSchemas.invoice,
  async run(context) {
    const { customer_id, invoice_date, due_date, invoice_number, reference_number, description, lines } = context.propsValue;
    const customerId = sageIntacctBodies.trimmed(customer_id);
    if (!customerId) {
      throw new Error('customer_id is required.');
    }
    const body = sageIntacctBodies.compact({
      customer: { id: customerId },
      invoiceDate: sageIntacctBodies.parseIsoDate({ value: invoice_date, label: 'invoice_date' }),
      dueDate: sageIntacctBodies.parseIsoDate({ value: due_date, label: 'due_date' }),
      invoiceNumber: sageIntacctBodies.trimmed(invoice_number),
      referenceNumber: sageIntacctBodies.trimmed(reference_number),
      description: sageIntacctBodies.trimmed(description),
      lines: sageIntacctBodies.parseLineItems({ value: lines, label: 'lines', extraDimensions: { customer: { id: customerId } } }),
    });
    const record = await sageIntacctClient.createRecord({ auth: context.auth, object: sageIntacctRecords.INVOICE_OBJECT, body });
    return sageIntacctRecords.toInvoice(record);
  },
});
