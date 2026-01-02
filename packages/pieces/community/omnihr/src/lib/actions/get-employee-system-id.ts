import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { omnihrAuth } from '../../index';
import { getAuthHeaders, OmniHrAuth } from '../common/client';

export const getEmployeeSystemId = createAction({
  auth: omnihrAuth,
  name: 'get_employee_system_id',
  displayName: 'Get Employee System ID by Email',
  description:
    'Searches for an employee by email and returns their system ID and user ID',
  props: {
    email: Property.ShortText({
      displayName: 'Employee Email',
      description: 'The email address of the employee to look up',
      required: true,
    }),
  },
  async run(context) {
    const { email } = context.propsValue;
    const auth = context.auth as OmniHrAuth;
    const headers = await getAuthHeaders(auth);
    let nextUrl: string | null = 'https://api.omnihr.co/api/v1/employee/list';

    while (nextUrl) {
      const listResponse: any = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: nextUrl,
        headers,
      });

      const employee = listResponse.body.results.find(
        (emp: any) =>
          emp.primary_email.value.toLowerCase() === email.toLowerCase()
      );

      if (employee) {
        return {
          system_id: employee.system_id,
          user_id: employee.id,
          full_name: employee.full_name,
          email: employee.primary_email.value,
        };
      }

      nextUrl = listResponse.body.next;
    }

    throw new Error(`Employee with email "${email}" not found`);
  },
});
