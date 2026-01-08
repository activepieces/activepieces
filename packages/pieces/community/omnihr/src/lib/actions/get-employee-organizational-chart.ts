import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { omnihrAuth } from '../../index';
import { getAuthHeaders, OmniHrAuth } from '../common/client';

export const getEmployeeOrganizationalChart = createAction({
  auth: omnihrAuth,
  name: 'get_employee_organizational_chart',
  displayName: 'Get Employee Organizational Chart',
  description:
    'Retrieves employee organizational relationships including the complete management chain, direct reports, and peers',
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

    const snapshotResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.omnihr.co/api/v1/employee/${system_id}/snapshot/`,
      headers,
    });

    const snapshot = snapshotResponse.body;
    const managementChain = [];
    let currentManager = snapshot.manager;

    while (currentManager?.manager_data?.system_id) {
      managementChain.push({
        id: currentManager.manager_data.id,
        system_id: currentManager.manager_data.system_id,
        full_name: currentManager.manager_data.full_name,
        first_name: currentManager.manager_data.first_name,
        last_name: currentManager.manager_data.last_name,
        preferred_name: currentManager.manager_data.preferred_name,
        email: currentManager.manager_data.primary_email?.value,
        phone: currentManager.manager_data.primary_phone?.value,
        position: currentManager.manager_data.position,
        department: currentManager.manager_data.department,
        location: currentManager.manager_data.location_name,
        country: currentManager.manager_data.country,
        employee_type: currentManager.manager_data.employee_type,
        effective_date: currentManager.effective_date,
      });

      const managerSystemId = currentManager.manager_data.system_id;

      try {
        const managerSnapshotResponse = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `https://api.omnihr.co/api/v1/employee/${managerSystemId}/snapshot/`,
          headers,
        });

        currentManager = managerSnapshotResponse.body.manager;
      } catch (error) {
        break;
      }
    }

    return {
      career_journey: snapshot.career_journey,
      management_chain: managementChain,
      direct_reports: snapshot.direct_reports,
      peers: snapshot.peers,
    };
  },
});
