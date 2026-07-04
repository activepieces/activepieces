import { createAction } from '@activepieces/pieces-framework';
import { airtableCommon } from '../common';
import { airtableAuth } from '../auth';

export const airtableDeleteRecordAction = createAction({
  auth: airtableAuth,
  name: 'airtable_delete_record',
  displayName: 'Delete Airtable Record',
  description: 'Deletes a record in airtable',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a single record from a table by its record ID. Use to remove a row when you have its ID. Effectively idempotent: once the record is gone, repeating the call has no further effect (later calls error on the missing ID).',
    idempotent: true,
  },
  props: {
    base: airtableCommon.base,
    tableId: airtableCommon.tableId,
    recordId: airtableCommon.recordId,
  },
  async run(context) {
    const personalToken = context.auth;
    const { base: baseId, tableId, recordId } = context.propsValue;

    return await airtableCommon.deleteRecord({
      personalToken: personalToken.secret_text,
      baseId: baseId as string,
      tableId: tableId as string,
      recordId: recordId as string,
    });
  },
});
