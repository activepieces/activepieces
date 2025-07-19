import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { helpScoutAuth } from '../common/auth';

export const findUser = createAction({
  name: 'find_user',
  displayName: 'Find User',
  description: 'Find a Help Scout user by email.',
  auth: helpScoutAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const params: Record<string, any> = {
      query: `(email:\"${propsValue['email']}\")`,
    };
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.helpscout.net/v2/users',
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
      },
      queryParams: params,
    });
    return response.body;
  },
}); 