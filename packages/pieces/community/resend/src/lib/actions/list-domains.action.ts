import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { listDomainsOutputSchema } from '../output-schemas';

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
  classification: 'SEARCH',
  auth: resendAuth,
  displayName: 'List Domains',
  outputSchema: listDomainsOutputSchema,
  description: 'Retrieve all domains added to your Resend account',
  audience: 'both',
  aiMetadata: { description: 'Retrieves all sending domains configured on the connected Resend account, including each domain\'s ID, name, verification status, and region. Use this to find a domain ID (e.g. for Verify Domain or Delete Domain) or to check which domains are verified before sending. Read-only and idempotent.', idempotent: true },
  props: {},
  async run({ auth }) {
    const response = await resendClient.sendRequest<{ data: DomainRecord[] }>({ auth: auth.secret_text, method: HttpMethod.GET, path: '/domains' });
    return response.data.map((d) => ({
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
