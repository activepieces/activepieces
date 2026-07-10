import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { omnihrAuth } from '../auth';
import { getAuthHeaders, OmniHrAuth } from '../common/client';

export const getDirectReports = createAction({
  auth: omnihrAuth,
  name: 'get_direct_reports',
  displayName: 'Get Employee Direct Reports',
  description:
    'Retrieves a list of employees who directly report to the specified employee',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the OmniHR employees who report directly to a given employee, identified by that employee\'s numeric ID. Use to find a manager\'s immediate team; for the broader hierarchy (management chain and peers) use the organizational chart action instead. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    system_id: Property.Number({
      displayName: 'User ID',
      description: 'The user ID of the employee',
      required: true,
    }),
  },
  async run(context) {
    const { system_id } = context.propsValue;
    const auth = context.auth as OmniHrAuth;
    const headers = await getAuthHeaders(auth);

    const directReportsResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.omnihr.co/api/v1/employee/${system_id}/direct-reports/`,
      headers,
    });

    return directReportsResponse.body;
  },
});
