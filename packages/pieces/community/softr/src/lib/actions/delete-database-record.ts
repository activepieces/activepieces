import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import {
  databaseIdDropdown,
  recordIdField,
  tableIdDropdown,
} from '../common/props';

export const deleteDatabaseRecord = createAction({
  auth: SoftrAuth,
  name: 'deleteDatabaseRecord',
  displayName: 'Delete Database Record',
  description: 'Deletes a existing database record.',
  props: {
    databaseId: databaseIdDropdown,
    tableId: tableIdDropdown,
    recordId: recordIdField,
  },
  async run({ auth, propsValue }) {
    const { databaseId, tableId, recordId } = propsValue;

    const response = await makeRequest(
      auth,
      HttpMethod.DELETE,
      `/databases/${databaseId}/tables/${tableId}/records/${recordId}`
    );

    return {
      success: true,
      message: 'Record deleted successfully',
      recordId: recordId,
    };
  },
});
