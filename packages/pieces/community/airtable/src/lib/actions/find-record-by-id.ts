import { createAction } from '@activepieces/pieces-framework';
import { airtableCommon } from '../common';
import { airtableAuth } from '../../index';
import { AirtableFindRecordRequest } from '../common/models';

export const airtableFindRecordByIdAction = createAction({
  auth: airtableAuth,
  name: 'airtable_find_record_by_id',
  displayName: 'Find Airtable Record by ID',
  description: 'Fetches a record from a table by its unique record ID',
  props: {
    baseId: airtableCommon.base,
    tableId: airtableCommon.tableId,
    recordId: airtableCommon.recordId,
  },
  async run(context) {
    const personalToken = context.auth as string;
    const { baseId, tableId, recordId } = context.propsValue;

    const req: AirtableFindRecordRequest = {
      personalToken,
      baseId: baseId as string,
      tableId: tableId as string,
      recordId: recordId as string,
    };

    return await airtableCommon.findRecordById(req);
  },
});
