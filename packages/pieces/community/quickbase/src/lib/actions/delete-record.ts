import { createAction } from '@activepieces/pieces-framework';
import { quickbaseAuth } from '../auth';
import { appIdProp, tableIdProp, recordIdDropdownProp } from '../common/props';
import { QuickbaseClient } from '../common/client';
import { QuickbaseDeleteRecordResponse } from '../common/types';

export const deleteRecord = createAction({
  name: 'delete_record',
  displayName: 'Delete Record',
  description: 'Delete a record from a Quickbase table',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently delete a single record from a Quickbase table, matched by its record ID. Use when removing one specific row. Requires the app, table, and record ID. Idempotent: re-running after the record is gone deletes nothing further (numberDeleted will be 0), but the destructive removal cannot be undone.',
    idempotent: true,
  },
  auth: quickbaseAuth,
  props: {
    appId: appIdProp,
    tableId: tableIdProp,
    recordId: recordIdDropdownProp,
  },
  async run(context) {
    const { appId, tableId, recordId } = context.propsValue;
    const client = new QuickbaseClient(context.auth.props.realmHostname, context.auth.props.userToken);

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