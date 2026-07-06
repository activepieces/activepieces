import { createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendProps } from '../common/props';

export const verifyDomain = createAction({
  name: 'verify_domain',
  auth: resendAuth,
  displayName: 'Verify Domain',
  description: 'Trigger a DNS verification check for a domain',
  audience: 'both',
  aiMetadata: { description: 'Triggers Resend to re-check the DNS records of a domain and update its verification status, identified by domain ID. Use this after adding the required DNS records (from Create Domain) to confirm the domain is ready to send. Safe to call repeatedly — it only re-runs the check.', idempotent: true },
  props: {
    domain_id: resendProps.domainId,
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest<{ object: string; id: string }>({
      method: HttpMethod.POST,
      url: `https://api.resend.com/domains/${propsValue.domain_id}/verify`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
    });
    return response.body;
  },
});
