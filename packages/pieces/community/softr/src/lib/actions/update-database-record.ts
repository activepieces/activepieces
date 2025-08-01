import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { databaseIdDropdown, recordIdDropdown, tableIdDropdown } from '../common/props';

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
    fields: Property.Object({
      displayName: 'Fields',
      description:
        'The fields to update in the record. Use field IDs as keys and new values as the field values. Only provided fields will be updated.',
      required: true,
    }),
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
