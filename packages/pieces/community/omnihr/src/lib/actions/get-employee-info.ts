import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { omnihrAuth } from '../auth';
import { getAuthHeaders, OmniHrAuth } from '../common/client';

export const getEmployeeInfo = createAction({
  auth: omnihrAuth,
  name: 'get_employee_info',
  displayName: 'Get Employee Details by System ID',
  description: 'Retrieves detailed employee information using their system ID',
  audience: 'both',
  aiMetadata: {
    description:
      "Fetches the full profile record for a single OmniHR employee identified by their numeric system ID. Use when you already have the employee's system ID (e.g. resolved via the email lookup action) and need their detailed details. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    system_id: Property.Number({
      displayName: 'System ID',
      description: 'The system ID of the employee',
      required: true,
    }),
  },
  async run(context) {
    const { system_id } = context.propsValue;
    const auth = context.auth as OmniHrAuth;
    const headers = await getAuthHeaders(auth);

    const employeeResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.omnihr.co/api/v1/employee/${system_id}/`,
      headers,
    });

    return employeeResponse.body;
  },
});
