import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartsuiteCommon } from '../common';
import { SMARTSUITE_API_URL, API_ENDPOINTS } from '../common/constants';

export const deleteRecord = createAction({
  name: 'delete_record',
  displayName: 'Delete a Record',
  description: 'Deletes a record from the specified table',
  auth: smartsuiteAuth,
  props: {
    solution: smartsuiteCommon.solution,
    table: smartsuiteCommon.table,
    record: smartsuiteCommon.record,
  },
  async run({ auth, propsValue }) {
    const { solution, table, record } = propsValue;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${SMARTSUITE_API_URL}${API_ENDPOINTS.DELETE_RECORD
          .replace('{solutionId}', solution as string)
          .replace('{appId}', table as string)
          .replace('{recordId}', record as string)}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });

      if (response.status === 204) {
        return {
          success: true,
          message: 'Record deleted successfully',
          recordId: record
        };
      }

      return response.body;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Record with ID ${record} not found in table ${table}`);
      }

      if (error.response?.status === 403) {
        throw new Error('You do not have permission to delete this record');
      }

      throw new Error(`Failed to delete record: ${error.message || 'Unknown error'}`);
    }
  },
});
