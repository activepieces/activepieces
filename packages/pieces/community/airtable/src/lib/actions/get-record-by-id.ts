import { createAction } from '@activepieces/pieces-framework';
import { airtableAuth } from '../../index';
import { airtableCommon } from '../common';

export const airtableGetRecordByIdAction = createAction({
  auth: airtableAuth,
  name: 'airtable_get_record_by_id',
  displayName: 'Find Record by ID',
  description: 'Get a record by its unique record ID.',
  props: {
    base: airtableCommon.base,
    tableId: airtableCommon.tableId,
    recordId: airtableCommon.recordIdDropdown,
  },
  async run(context) {
    const personalToken = context.auth;
    const { base: baseId, tableId, recordId } = context.propsValue;

    if (!baseId || !tableId || !recordId) {
      throw new Error('Base, Table, and Record must be selected.');
    }

    return await airtableCommon.getRecordById({
      personalToken,
      baseId: baseId as string,
      tableId: tableId as string,
      recordId: recordId as string,
    });
  },
});
