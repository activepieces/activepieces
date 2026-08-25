import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { straleAuth } from '../auth';

export const trustProfile = createAction({
  name: 'trust_profile',
  auth: straleAuth,
  displayName: 'Trust Profile',
  description:
    'Returns the trust profile for a capability: SQS quality score (0-100), Quality grade (A-F), Reliability grade (A-F), and execution guidance. Use this before relying on a capability for high-stakes decisions. No API key required.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch the trust profile for a Strale slug — quality score (0-100), quality and reliability grades (A-F), and execution guidance. Set the type to look up either an individual capability or a bundled solution. Use this to gauge reliability before depending on a capability for high-stakes decisions. Read-only and idempotent; requires the target slug.',
    idempotent: true,
  },
  props: {
    slug: Property.ShortText({
      displayName: 'Capability Slug',
      description:
        'The slug of the capability to check (e.g. "sanctions-check", "iban-validate")',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Whether this is a capability or a bundled solution',
      required: false,
      defaultValue: 'capability',
      options: {
        options: [
          { label: 'Capability', value: 'capability' },
          { label: 'Solution', value: 'solution' },
        ],
      },
    }),
  },
  async run(context) {
    const { slug, type } = context.propsValue;
    const endpoint =
      type === 'solution'
        ? `/v1/internal/trust/solutions/${encodeURIComponent(slug)}`
        : `/v1/internal/trust/capabilities/${encodeURIComponent(slug)}`;
    const response = await httpClient.sendRequest({
      url: `https://api.strale.io${endpoint}`,
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN as const,
        token: context.auth.secret_text,
      },
    });
    return response.body;
  },
});
