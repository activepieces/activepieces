import { createAction } from '@activepieces/pieces-framework';
import { airtableCommon } from '../common';
import { airtableAuth } from '../../index';

export const airtableDeleteRecordAction = createAction({
  auth: airtableAuth,
  name: 'airtable_delete_record',
  displayName: 'Delete Airtable Record',
  description: 'Deletes a record in airtable',
  props: {
    base: airtableCommon.base,
    tableId: airtableCommon.tableId,
    recordId: airtableCommon.recordId,
  },
  async run(context) {
    const personalToken = context.auth;
    const { base: baseId, tableId, recordId } = context.propsValue;

    return await airtableCommon.deleteRecord({
      personalToken,
      baseId: baseId as string,
      tableId: tableId as string,
      recordId: recordId as string,
    });
  },
});
