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

    const listResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.omnihr.co/api/v1/employee/list/min-v2',
      headers,
      queryParams: {
        exclude_self: 'false',
      },
    });

    const employee = listResponse.body.find(
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

    throw new Error(`Employee with email "${email}" not found`);
  },
});
