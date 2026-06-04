import { createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendProps } from '../common/props';

export const deleteAudience = createAction({
  name: 'delete_audience',
  auth: resendAuth,
  displayName: 'Delete Audience',
  description: 'Permanently delete an audience and all its contacts',
  props: {
    audience_id: resendProps.audienceId,
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest<{ object: string; id: string; deleted: boolean }>({
      method: HttpMethod.DELETE,
      url: `https://api.resend.com/audiences/${propsValue.audience_id}`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
    });
    return response.body;
  },
});
