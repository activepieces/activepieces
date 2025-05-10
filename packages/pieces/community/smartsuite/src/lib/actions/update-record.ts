import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartsuiteCommon, formatRecordFields, handleSmartSuiteError } from '../common';
import { SMARTSUITE_API_URL, API_ENDPOINTS } from '../common/constants';

export const updateRecord = createAction({
  name: 'update_record',
  displayName: 'Update a Record',
  description: 'Updates an existing record in the specified table',
  auth: smartsuiteAuth,
  props: {
    solution: smartsuiteCommon.solution,
    table: smartsuiteCommon.table,
    record: smartsuiteCommon.record,
    fields: smartsuiteCommon.tableFields,
  },
  async run({ auth, propsValue }) {
    const { solution, table, record, fields } = propsValue;

    const formattedFields = formatRecordFields(fields);

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.PATCH,
        url: `${SMARTSUITE_API_URL}${API_ENDPOINTS.UPDATE_RECORD
          .replace('{solutionId}', solution as string)
          .replace('{appId}', table as string)
          .replace('{recordId}', record as string)}`,
        body: {
          fields: formattedFields
        },
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