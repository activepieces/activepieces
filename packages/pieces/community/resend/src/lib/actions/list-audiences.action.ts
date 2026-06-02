import { createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';

export const listAudiences = createAction({
  name: 'list_audiences',
  auth: resendAuth,
  displayName: 'List Audiences',
  description: 'Retrieve all contact audiences in your Resend account',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest<{
      data: { id: string; name: string; created_at: string }[];
    }>({
      method: HttpMethod.GET,
      url: 'https://api.resend.com/audiences',
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
    });
    return response.body.data;
  },
});
