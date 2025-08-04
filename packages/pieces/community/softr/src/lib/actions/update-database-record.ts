import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import {
  databaseIdDropdown,
  recordIdField,
  tableFields,
  tableIdDropdown,
} from '../common/props';
import { isNil } from '@activepieces/shared';

export const updateDatabaseRecord = createAction({
  auth: SoftrAuth,
  name: 'updateDatabaseRecord',
  displayName: 'Update Database Record',
  description: 'Updates an existing database record.',
  props: {
    databaseId: databaseIdDropdown,
    tableId: tableIdDropdown,
    recordId: recordIdField,
    fields: tableFields,
  },
  async run({ auth, propsValue }) {
    const { databaseId, tableId, recordId } = propsValue;

    const fields = propsValue.fields ?? {};

    const formattedFields: Record<string, any> = {};

    for (const [key, value] of Object.entries(fields)) {
      if (isNil(value) || value === '') continue;
      if (Array.isArray(value) && value.length === 0) continue;
      formattedFields[key] = value;
    }

    const response = await makeRequest(
      auth,
      HttpMethod.PATCH,
      `/databases/${databaseId}/tables/${tableId}/records/${recordId}`,
      {
        fields: formattedFields,
      }
    );

    return response;
  },
});
