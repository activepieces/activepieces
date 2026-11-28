import { createAction } from '@activepieces/pieces-framework';
import { sageIntacctAuth } from '../auth';
import { sageIntacctClient } from '../common/client';
import { sageIntacctRecords, sageIntacctSchemas } from '../common/output-schemas';
import { sageIntacctBodies, sageIntacctProps } from '../common/props';

export const updateBillAction = createAction({
  auth: sageIntacctAuth,
  name: 'update_bill',
  displayName: 'Update Bill',
  description: 'Update header fields on an existing AP bill. Empty fields are left unchanged; lines are not changed.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates header fields on an existing Sage Intacct AP bill with PATCH, sending only the fields you fill; empty fields keep their current values. bill_key is the bill record key (from Find Bill), not the bill number. Fields: bill_date and due_date (strict YYYY-MM-DD), bill_number, reference_number, description. Lines cannot be changed here. Returns the saved bill. Idempotent: repeating the same update leaves the same values.',
    idempotent: true,
  },
  props: {
    bill_key: sageIntacctProps.recordDropdown({
      object: sageIntacctRecords.BILL_OBJECT,
      displayName: 'Bill',
      description: 'The bill to update. In an agent, pass the bill record key.',
      labelPaths: ['billNumber', 'vendor.name'],
      orderBy: [{ key: 'desc' }],
      searchPaths: ['billNumber', 'vendor.name'],
    }),
    bill_date: sageIntacctProps.dateProp({ displayName: 'Bill Date', required: false }),
    due_date: sageIntacctProps.dateProp({ displayName: 'Due Date', required: false }),
    bill_number: sageIntacctProps.text({ displayName: 'Bill Number' }),
    reference_number: sageIntacctProps.text({ displayName: 'Reference Number' }),
    description: sageIntacctProps.text({ displayName: 'Description' }),
  },
  outputSchema: sageIntacctSchemas.bill,
  async run(context) {
    const { bill_key, bill_date, due_date, bill_number, reference_number, description } = context.propsValue;
    const key = sageIntacctBodies.recordKey(bill_key);
    if (!key) {
      throw new Error('Bill is required.');
    }
    const body = sageIntacctBodies.compact({
      createdDate: sageIntacctBodies.parseIsoDate({ value: bill_date, label: 'Bill Date' }),
      dueDate: sageIntacctBodies.parseIsoDate({ value: due_date, label: 'Due Date' }),
      billNumber: sageIntacctBodies.trimmed(bill_number),
      referenceNumber: sageIntacctBodies.trimmed(reference_number),
      description: sageIntacctBodies.trimmed(description),
    });
    if (Object.keys(body).length === 0) {
      throw new Error('Fill at least one field to update.');
    }
    const record = await sageIntacctClient.updateRecord({ auth: context.auth, object: sageIntacctRecords.BILL_OBJECT, key, body });
    return sageIntacctRecords.toBill(record);
  },
});
