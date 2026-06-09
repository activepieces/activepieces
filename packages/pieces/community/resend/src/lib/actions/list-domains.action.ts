import { createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';

interface DomainRecord {
  id: string;
  name: string;
  status: string;
  region: string;
  created_at: string;
  capabilities: { sending: string; receiving: string };
}

export const listDomains = createAction({
  name: 'list_domains',
  auth: resendAuth,
  displayName: 'List Domains',
  description: 'Retrieve all domains added to your Resend account',
  audience: 'both',
  aiMetadata: { description: 'Retrieves all sending domains configured on the connected Resend account, including each domain\'s ID, name, verification status, and region. Use this to find a domain ID (e.g. for Verify Domain or Delete Domain) or to check which domains are verified before sending. Read-only and idempotent.', idempotent: true },
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest<{ data: DomainRecord[] }>({
      method: HttpMethod.GET,
      url: 'https://api.resend.com/domains',
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
    });
    return response.body.data.map((d) => ({
      id: d.id,
      name: d.name,
      status: d.status,
      region: d.region,
      created_at: d.created_at,
      sending: d.capabilities?.sending ?? '',
      receiving: d.capabilities?.receiving ?? '',
    }));
  },
});
