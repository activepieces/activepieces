import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { veezeeApiCall, veezeeAuth } from '../common';

export const resolveLinkedinUrlAction = createAction({
  name: 'resolve_linkedin_url',
  displayName: 'Identify LinkedIn URL',
  description:
    'Identify what a LinkedIn URL points at (person, company, or post) and get its stable id, handle, and canonical URL. Costs 2 credits; works with or without an API key.',
  audience: 'both',
  aiMetadata: {
    description:
      'Identify a LinkedIn URL before fetching it: returns type (person, company, or post), the stable id, handle, and canonical URL. Messy URLs with utm params, www/m subdomains, or trailing slashes are fine. Skip this when you already have a clean slug, URN, or URL — Get LinkedIn Profile and Get LinkedIn Company accept those directly, so resolving first would waste 2 credits. Non-LinkedIn URLs are rejected. Costs 2 credits. Works keyless. Read-only lookup, safe to repeat.',
    idempotent: true,
  },
  auth: veezeeAuth,
  requireAuth: false,
  props: {
    url: Property.ShortText({
      displayName: 'LinkedIn URL',
      description:
        'Any LinkedIn profile, company, or post URL, e.g. https://www.linkedin.com/in/williamhgates or https://www.linkedin.com/company/microsoft.',
      required: true,
    }),
  },
  async run(context) {
    return veezeeApiCall({
      apiKey: context.auth?.secret_text || undefined,
      method: HttpMethod.GET,
      resourceUri: '/v1/resolve-url',
      query: {
        url: context.propsValue.url,
      },
    });
  },
});
