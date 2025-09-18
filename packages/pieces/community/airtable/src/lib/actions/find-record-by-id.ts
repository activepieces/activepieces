import { createAction } from '@activepieces/pieces-framework';
import { airtableAuth } from '../../index';
import { airtableCommon } from '../common';

export const airtableGetRecordByIdAction = createAction({
  auth: airtableAuth,
  name: 'airtable_get_record_by_id',
  displayName: 'Get Record by ID',
  description: 'Retrieve a single record from a table by its unique ID.',
  props: {
    base: airtableCommon.base,
    tableId: airtableCommon.tableId,
    recordId: airtableCommon.recordIdDropdown, 
  },
  async run(context) {
    const { auth: personalToken, propsValue } = context;
    const { base: baseId, tableId, recordId } = propsValue;

    return await airtableCommon.getRecordById({
      personalToken,
      baseId: baseId as string,
      tableId: tableId as string,
      recordId: recordId as string,
    });
  },
});