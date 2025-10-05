import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplybookAuth, getAccessToken, SimplybookAuth } from '../common';

export const createClient = createAction({
  auth: simplybookAuth,
  name: 'create_client',
  displayName: 'Create Client',
  description: 'Create a new client record',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Client name',
      required: true
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Client email address',
      required: true
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Client phone number (e.g., +123456789987)',
      required: true
    })
  },
  async run(context) {
    const auth = context.auth as SimplybookAuth;
    const accessToken = await getAccessToken(auth);

    const clientData = {
      name: context.propsValue.name,
      email: context.propsValue.email,
      phone: context.propsValue.phone
    };

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://user-api-v2.simplybook.me/admin/clients',
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Login': auth.companyLogin,
          'X-Token': accessToken
        },
        body: clientData
      });

      return response.body;
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to create client: ${error.response.status} - ${JSON.stringify(error.response.body)}`
        );
      }
      throw new Error(`Failed to create client: ${error.message}`);
    }
  }
});
