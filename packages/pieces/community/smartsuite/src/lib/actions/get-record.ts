import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartsuiteCommon, handleSmartSuiteError } from '../common';
import { SMARTSUITE_API_URL, API_ENDPOINTS } from '../common/constants';

export const getRecord = createAction({
  name: 'get_record',
  displayName: 'Get a Record',
  description: 'Retrieves a specific record by ID',
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
        method: HttpMethod.GET,
        url: `${SMARTSUITE_API_URL}${API_ENDPOINTS.GET_RECORD
          .replace('{solutionId}', solution as string)
          .replace('{appId}', table as string)
          .replace('{recordId}', record as string)}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });

      return response.body;
    } catch (error) {
      const smartSuiteError = handleSmartSuiteError(error);
      throw new Error(smartSuiteError.message);
    }
  },
}); 