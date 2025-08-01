import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { databaseIdDropdown, tableIdDropdown } from '../common/props';
import { table } from 'console';

export const createDatabaseRecord = createAction({
  auth: SoftrAuth,
  name: 'createDatabaseRecord',
  displayName: 'Create Database Record',
  description: 'Insert a new record into a specified Softr database table',
  props: {
    databaseId: databaseIdDropdown,
    tableId: tableIdDropdown,
    fields: Property.Object({
      displayName: 'Fields',
      description:
        'The fields to create in the record. Use field IDs as keys and values as the field values.',
      required: true,
    }),
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

    return response;
  },
});
