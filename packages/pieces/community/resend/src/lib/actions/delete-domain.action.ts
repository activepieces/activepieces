import { createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendProps } from '../common/props';

export const deleteDomain = createAction({
  name: 'delete_domain',
  auth: resendAuth,
  displayName: 'Delete Domain',
  description: 'Remove a domain from your Resend account',
  props: {
    domain_id: resendProps.domainId,
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest<{ object: string; id: string; deleted: boolean }>({
      method: HttpMethod.DELETE,
      url: `https://api.resend.com/domains/${propsValue.domain_id}`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
    });
    return response.body;
  },
});
