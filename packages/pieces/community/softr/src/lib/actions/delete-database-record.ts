import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import {
  databaseIdDropdown,
  recordIdDropdown,
  tableIdDropdown,
} from '../common/props';
import { table } from 'console';

export const deleteDatabaseRecord = createAction({
  auth: SoftrAuth,
  name: 'deleteDatabaseRecord',
  displayName: 'Delete Database Record',
  description: 'Delete a specific record from a Softr database table by its ID',
  props: {
    databaseId: databaseIdDropdown,
    tableId: tableIdDropdown,
    recordId: recordIdDropdown,
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
