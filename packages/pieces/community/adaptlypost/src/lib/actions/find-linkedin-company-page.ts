import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { adaptlyPostAuth } from '../auth';
import { adaptlyPostClient } from '../common/client';

type LinkedInOrganization = {
  id: string;
  name: string;
  vanityName: string | null;
  urn: string;
  mention: string;
};

export const findLinkedInCompanyPageAction = createAction({
  auth: adaptlyPostAuth,
  name: 'find_linkedin_company_page',
  classification: 'READ',
  displayName: 'Find LinkedIn Company Page',
  description:
    'Finds a LinkedIn company page and returns the mention that tags it in a LinkedIn post.',
  audience: 'both',
  aiMetadata: {
    description:
      'Look up a LinkedIn company page by its URL or exact vanity name and return its mention string, which tags the page when placed in the Text of a LinkedIn post made with Create Post. LinkedIn matches the exact vanity name only, so part of a name finds nothing and found is false. Safe to retry.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Company Page',
      description:
        'The page URL, such as https://www.linkedin.com/company/acme/, its vanity name acme, or @acme.',
      required: true,
    }),
  },
  async run(context) {
    const response = await adaptlyPostClient.request<{
      organization: LinkedInOrganization | null;
    }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/linkedin-organizations/lookup',
      query: { query: context.propsValue.query },
    });
    const organization = response.organization;
    return {
      found: organization !== null,
      organization_id: organization?.id ?? null,
      name: organization?.name ?? null,
      vanity_name: organization?.vanityName ?? null,
      urn: organization?.urn ?? null,
      mention: organization?.mention ?? null,
    };
  },
});
