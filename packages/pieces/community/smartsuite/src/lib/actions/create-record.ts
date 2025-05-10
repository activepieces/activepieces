import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartsuiteCommon, formatRecordFields } from '../common';
import { SMARTSUITE_API_URL, API_ENDPOINTS } from '../common/constants';

export const createRecord = createAction({
  name: 'create_record',
  displayName: 'Create a Record',
  description: 'Creates a new record in the specified table',
  auth: smartsuiteAuth,
  props: {
    solution: smartsuiteCommon.solution,
    table: smartsuiteCommon.table,
    fields: smartsuiteCommon.tableFields,
  },
  async run({ auth, propsValue }) {
    const { solution, table, fields } = propsValue;

    const formattedFields = formatRecordFields(fields);

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${SMARTSUITE_API_URL}${API_ENDPOINTS.CREATE_RECORD
          .replace('{solutionId}', solution as string)
          .replace('{appId}', table as string)}`,
        body: {
          fields: formattedFields
        },
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });

      return response.body;
    } catch (error: any) {
      if (error.response?.status === 422) {
        throw new Error(`Invalid request: ${error.response?.body?.message || 'Missing required fields or invalid data'}`);
      }

      if (error.response?.status === 403) {
        throw new Error('You do not have permission to create records in this table');
      }

      if (error.response?.status === 404) {
        throw new Error(`Solution or table not found: ${solution}/${table}`);
      }

      throw new Error(`Failed to create record: ${error.message || 'Unknown error'}`);
    }
  },
});
