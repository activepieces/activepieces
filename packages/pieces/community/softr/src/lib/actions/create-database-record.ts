import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import {
  databaseIdDropdown,
  getdynamicfields,
  tableIdDropdown,
} from '../common/props';
import { table } from 'console';

export const createDatabaseRecord = createAction({
  auth: SoftrAuth,
  name: 'createDatabaseRecord',
  displayName: 'Create Database Record',
  description: 'Insert a new record into a specified Softr database table',
  props: {
    databaseId: databaseIdDropdown,
    tableId: tableIdDropdown,
    fields: getdynamicfields,
  },
  async run({ auth, propsValue }) {
    const { databaseId, tableId, fields } = propsValue;

    const response = await makeRequest(
      auth,
      HttpMethod.POST,
      `/databases/${databaseId}/tables/${tableId}/records`,
      {
        fields: fields,
      }
    );

    return {
      record: response.data,
      success: true,
      message: 'Record created successfully',
    };
  },
});
