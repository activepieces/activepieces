import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';

export const createDomain = createAction({
  name: 'create_domain',
  auth: resendAuth,
  displayName: 'Create Domain',
  description: 'Add a sending domain to your Resend account and get the DNS records to verify it',
  audience: 'both',
  aiMetadata: { description: 'Registers a new sending domain on the Resend account and returns the DNS records that must be added to verify it. Use this as the first step in setting up a custom sending domain before triggering verification. Not idempotent — each call attempts to create a new domain entry.', idempotent: false },
  props: {
    name: Property.ShortText({
      displayName: 'Domain Name',
      description: 'The domain you want to send from, e.g. mail.yourdomain.com',
      required: true,
    }),
    region: Property.StaticDropdown({
      displayName: 'Region',
      description: 'AWS region for email delivery. Defaults to US East.',
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
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = { name: propsValue.name };
    if (propsValue.region) body['region'] = propsValue.region;

    const response = await httpClient.sendRequest<{
      id: string;
      name: string;
      status: string;
      region: string;
      created_at: string;
      capabilities: { sending: string; receiving: string };
      records: { record: string; name: string; type: string; value: string; status: string; ttl: string }[];
    }>({
      method: HttpMethod.POST,
      url: 'https://api.resend.com/domains',
      authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.secret_text },
      body,
    });

    const d = response.body;
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
