import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { omnihrAuth } from '../../index';
import { getAuthHeaders, OmniHrAuth } from '../common/client';

export const getDirectReports = createAction({
  auth: omnihrAuth,
  name: 'get_direct_reports',
  displayName: 'Get Employee Direct Reports',
  description:
    'Retrieves a list of employees who directly report to the specified employee',
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
