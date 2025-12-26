import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { narmiAuth } from '../..';

export const updateAccountApplication = createAction({
  name: 'update_account_application',
  auth: narmiAuth,
  displayName: 'Update Account Application',
  description: 'Update an existing account application',
  props: {
    uuid: Property.ShortText({
      displayName: 'Application UUID',
      description: 'The UUID of the account application to update',
      required: true,
    }),
    csrfToken: Property.ShortText({
      displayName: 'CSRF Token',
      description: 'CSRF token obtained from GET /csrf endpoint',
      required: true,
    }),
    updateData: Property.Json({
      displayName: 'Update Data',
      description: 'JSON object containing the fields to update (e.g., applicants, selected_products, funding)',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const baseUrl = auth.baseUrl;
    const { uuid, csrfToken, updateData } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `${baseUrl}/v1/account_opening/${uuid}/`,
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRFTOKEN': csrfToken,
      },
      body: updateData,
    });

    return response.body;
  },
});
