import { createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendProps } from '../common/props';

export const deleteDomain = createAction({
  name: 'delete_domain',
  auth: resendAuth,
  displayName: 'Delete Domain',
  description: 'Remove a domain from your Resend account',
  audience: 'both',
  aiMetadata: { description: 'Permanently removes a sending domain from the Resend account, identified by its domain ID. Use this to decommission a domain you no longer send from. Effectively idempotent — once deleted, repeating the call has no further effect.', idempotent: true },
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
