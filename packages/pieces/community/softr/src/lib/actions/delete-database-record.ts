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
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes a single record from a chosen table of a Softr database, identified by its record ID. Use when you already hold the target record ID (e.g. from a find or trigger). Idempotent on a stable record ID — once deleted the record stays gone.', idempotent: true },
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
