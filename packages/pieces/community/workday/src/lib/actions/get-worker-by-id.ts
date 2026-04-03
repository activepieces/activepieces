import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { workdayAuth } from '../common/auth';

export const getWorkerById = createAction({
  auth: workdayAuth,
  name: 'get_worker_by_id',
  displayName: 'Get Worker by ID',
  description: 'Retrieves a worker and their current staffing information by Worker ID.',
  props: {
    worker_id: Property.ShortText({
      displayName: 'Worker ID',
      description: 'The Workday Worker ID (WID) of the employee to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as OAuth2PropertyValue;
    const { hostname, tenant } = auth.props!;
    const { worker_id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://${hostname}/ccx/api/staffing/v6/${tenant}/workers/${worker_id}`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});
