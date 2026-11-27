import { createAction, Property } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient } from '../common/client';
import { sageIntacctRecords, sageIntacctSchemas } from '../common/output-schemas';
import { sageIntacctBodies } from '../common/props';

export const createBillAiAction = createAction({
  auth: sageIntacctAuth,
  name: 'create_bill_ai',
  displayName: 'Create Bill (AI)',
  description: 'Create an AP bill in Sage Intacct from plain fields and a JSON line list.',
  classification: 'WRITE',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates an AP bill in Sage Intacct. vendor_id is the vendor ID (for example "V-100", from Find Vendor). bill_date and due_date are strict YYYY-MM-DD dates. lines is a JSON array where each entry is {"gl_account_id": "<GL account ID from List GL Accounts>", "amount": <non-zero number>, "memo": "<optional>", "location_id": "<optional>", "department_id": "<optional>"}. Many companies require location_id on expense accounts (error "requires a Site"); get IDs from List Locations. bill_number is the vendor\'s bill number and optional. Returns the saved bill with its key (record number), totals and state. Not idempotent: a repeat call creates another bill.',
    idempotent: false,
  },
  props: {
    vendor_id: Property.ShortText({
      displayName: 'Vendor ID',
      description: 'The vendor ID, for example V-100.',
      required: true,
    }),
    bill_date: Property.ShortText({ displayName: 'Bill Date', description: 'YYYY-MM-DD', required: true }),
    due_date: Property.ShortText({ displayName: 'Due Date', description: 'YYYY-MM-DD', required: true }),
    bill_number: Property.ShortText({ displayName: 'Bill Number', required: false }),
    reference_number: Property.ShortText({ displayName: 'Reference Number', required: false }),
    description: Property.ShortText({ displayName: 'Description', required: false }),
    lines: Property.Json({
      displayName: 'Lines',
      description: 'JSON array of lines; each needs gl_account_id and a non-zero amount.',
      required: true,
    }),
  },
  outputSchema: sageIntacctSchemas.bill,
  async run(context) {
    const { vendor_id, bill_date, due_date, bill_number, reference_number, description, lines } = context.propsValue;
    const vendorId = sageIntacctBodies.trimmed(vendor_id);
    if (!vendorId) {
      throw new Error('vendor_id is required.');
    }
    const body = sageIntacctBodies.compact({
      vendor: { id: vendorId },
      createdDate: sageIntacctBodies.parseIsoDate({ value: bill_date, label: 'bill_date' }),
      dueDate: sageIntacctBodies.parseIsoDate({ value: due_date, label: 'due_date' }),
      billNumber: sageIntacctBodies.trimmed(bill_number),
      referenceNumber: sageIntacctBodies.trimmed(reference_number),
      description: sageIntacctBodies.trimmed(description),
      lines: sageIntacctBodies.parseLineItems({ value: lines, label: 'lines', extraDimensions: { vendor: { id: vendorId } } }),
    });
    const record = await sageIntacctClient.createRecord({ auth: context.auth, object: sageIntacctRecords.BILL_OBJECT, body });
    return sageIntacctRecords.toBill(record);
  },
});
