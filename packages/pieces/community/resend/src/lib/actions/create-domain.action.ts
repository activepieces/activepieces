import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { createDomainOutputSchema } from '../output-schemas';

export const createDomain = createAction({
  name: 'create_domain',
  classification: 'WRITE',
  auth: resendAuth,
  displayName: 'Create Domain',
  outputSchema: createDomainOutputSchema,
  description: 'Add a sending domain and get the DNS records to verify it.',
  audience: 'both',
  aiMetadata: { description: 'Registers a new sending domain on the Resend account and returns the DNS records that must be added to verify it. Use this as the first step in setting up a custom sending domain before triggering verification. Not idempotent — each call attempts to create a new domain entry.', idempotent: false },
  propertyGroups: [
    { key: 'domain', display: 'section', label: 'Domain', icon: 'inbox', props: ['name', 'region', 'info'] },
  ],
  props: {
    name: Property.ShortText({
      displayName: 'Domain Name',
      description: 'The domain or subdomain you will send from.',
      placeholder: 'mail.acme.com',
      required: true,
    }),
    region: Property.StaticDropdown({
      displayName: 'Region',
      description: 'Where Resend sends from. Empty uses US East.',
      required: false,
      options: {
        options: [
          { label: 'US East (N. Virginia)', value: 'us-east-1' },
          { label: 'EU West (Ireland)', value: 'eu-west-1' },
          { label: 'Asia Pacific (Tokyo)', value: 'ap-northeast-1' },
          { label: 'South America (São Paulo)', value: 'sa-east-1' },
        ],
      },
    }),
    info: Property.MarkDown({
      value: 'Add the returned DNS records at your DNS provider, then run Verify Domain.',
      variant: MarkdownVariant.INFO,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = { name: propsValue.name };
    if (propsValue.region) body['region'] = propsValue.region;

    const response = await resendClient.sendRequest<{
      id: string;
      name: string;
      status: string;
      region: string;
      created_at: string;
      capabilities: { sending: string; receiving: string };
      records: { record: string; name: string; type: string; value: string; status: string; ttl: string }[];
    }>({ auth: auth.secret_text, method: HttpMethod.POST, path: '/domains', body: body });

    const d = response;
    return {
      id: d.id,
      name: d.name,
      status: d.status,
      region: d.region,
      created_at: d.created_at,
      sending: d.capabilities?.sending ?? '',
      receiving: d.capabilities?.receiving ?? '',
      dns_records: d.records,
    };
  },
});
