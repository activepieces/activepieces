import { createAction } from '@activepieces/pieces-framework';
import { quickbaseAuth } from '../common/auth';
import { appIdProp, tableIdProp, recordIdProp } from '../common/props';
import { QuickbaseClient } from '../common/client';
import { QuickbaseDeleteRecordResponse } from '../common/types';

export const deleteRecord = createAction({
  name: 'delete_record',
  displayName: 'Delete Record',
  description: 'Delete a record from a Quickbase table',
  auth: quickbaseAuth,
  props: {
    appId: appIdProp,
    tableId: tableIdProp,
    recordId: recordIdProp,
  },
  async run(context) {
    const { appId, tableId, recordId } = context.propsValue;
    const client = new QuickbaseClient(context.auth);

    const response = await client.delete<QuickbaseDeleteRecordResponse>('/records', {
      from: tableId,
      where: `{3.EX.${recordId}}`,
    });

    return {
      recordId: recordId,
      deleted: response.numberDeleted > 0,
      numberDeleted: response.numberDeleted,
      success: true,
    };
  },
});