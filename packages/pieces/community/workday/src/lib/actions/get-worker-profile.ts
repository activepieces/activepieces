import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { workdayAuth } from '../common/auth';

export const getWorkerProfile = createAction({
  auth: workdayAuth,
  name: 'get_worker_profile',
  displayName: 'Get Worker Profile',
  description:
    'Retrieves a worker profile including primary work location, hire date, and employment status.',
  props: {
    worker_id: Property.ShortText({
      displayName: 'Worker ID',
      description: 'The Workday Worker ID (WID) of the employee.',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as OAuth2PropertyValue;
    const { hostname, tenant } = auth.props!;
    const { worker_id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://${hostname}/ccx/api/staffing/v6/${tenant}/workers/${worker_id}/workerProfile`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
      },
    });

    return response.body;
  },
});
