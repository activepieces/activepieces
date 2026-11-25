import { createAction } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient } from '../common/client';
import { sageIntacctRecords, sageIntacctSchemas } from '../common/output-schemas';
import { sageIntacctBodies, sageIntacctProps } from '../common/props';

export const createBillAction = createAction({
  auth: sageIntacctAuth,
  name: 'create_bill',
  displayName: 'Create Bill',
  description: 'Create an AP bill in Sage Intacct.',
  classification: 'WRITE',
  audience: 'human',
  props: {
    vendor_key: sageIntacctProps.recordDropdown({
      object: sageIntacctRecords.VENDOR_OBJECT,
      displayName: 'Vendor',
      description: 'The vendor the bill is from.',
    }),
    bill_date: sageIntacctProps.dateProp({ displayName: 'Bill Date', required: true }),
    due_date: sageIntacctProps.dateProp({ displayName: 'Due Date', required: true }),
    bill_number: sageIntacctProps.text({ displayName: 'Bill Number', description: "The vendor's bill or invoice number." }),
    reference_number: sageIntacctProps.text({ displayName: 'Reference Number' }),
    description: sageIntacctProps.text({ displayName: 'Description' }),
    lines: sageIntacctProps.lineItemsProp(),
  },
  outputSchema: sageIntacctSchemas.bill,
  async run(context) {
    const { vendor_key, bill_date, due_date, bill_number, reference_number, description, lines } = context.propsValue;
    const key = sageIntacctBodies.recordKey(vendor_key);
    if (!key) {
      throw new Error('Vendor is required.');
    }
    const body = sageIntacctBodies.compact({
      vendor: { key },
      createdDate: sageIntacctBodies.parseIsoDate({ value: bill_date, label: 'Bill Date' }),
      dueDate: sageIntacctBodies.parseIsoDate({ value: due_date, label: 'Due Date' }),
      billNumber: sageIntacctBodies.trimmed(bill_number),
      referenceNumber: sageIntacctBodies.trimmed(reference_number),
      description: sageIntacctBodies.trimmed(description),
      lines: sageIntacctBodies.parseLineItems({ value: lines, label: 'Lines', extraDimensions: { vendor: { key } } }),
    });
    const record = await sageIntacctClient.createRecord({ auth: context.auth, object: sageIntacctRecords.BILL_OBJECT, body });
    return sageIntacctRecords.toBill(record);
  },
});
