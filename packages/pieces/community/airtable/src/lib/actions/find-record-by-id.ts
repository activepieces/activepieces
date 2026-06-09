import { createAction } from '@activepieces/pieces-framework';
import { airtableAuth } from '../auth';
import { airtableCommon } from '../common';

export const airtableGetRecordByIdAction = createAction({
  auth: airtableAuth,
  name: 'airtable_get_record_by_id',
  displayName: 'Get Record by ID',
  description: 'Retrieve a single record from a table by its unique ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves a single record and its field values from a table by the record ID. Use when you already know the exact record ID; to find records by a field value instead, use Find Airtable Record. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    base: airtableCommon.base,
    tableId: airtableCommon.tableId,
    recordId: airtableCommon.recordIdDropdown, 
  },
  async run(context) {
    const { auth: personalToken, propsValue } = context;
    const { base: baseId, tableId, recordId } = propsValue;

    return await airtableCommon.getRecordById({
      personalToken: personalToken.secret_text,
      baseId: baseId as string,
      tableId: tableId as string,
      recordId: recordId as string,
    });
  },
});