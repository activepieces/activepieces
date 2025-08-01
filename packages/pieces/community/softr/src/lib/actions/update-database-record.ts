import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { databaseIdDropdown, getdynamicfields, recordIdDropdown, tableIdDropdown } from '../common/props';

export const updateDatabaseRecord = createAction({
  auth: SoftrAuth,
  name: 'updateDatabaseRecord',
  displayName: 'Update Database Record',
  description:
    'Update a specific record in a Softr database table. This is a partial update - only provided fields will be changed.',
  props: {
    databaseId: databaseIdDropdown,
    tableId: tableIdDropdown,
    recordId: recordIdDropdown,
    fields: getdynamicfields,
  },
  async run({ auth, propsValue }) {
    const { databaseId, tableId, recordId, fields } = propsValue;

    const response = await makeRequest(
      auth,
      HttpMethod.PATCH,
      `/databases/${databaseId}/tables/${tableId}/records/${recordId}`,
      {
        fields: fields,
      }
    );

    return response;
  },
});
