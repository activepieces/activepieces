import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const linkedinCompanyLookup = createAction({
  auth: pubrioAuth,
  name: 'linkedin_company_lookup',
  displayName: 'Company LinkedIn Lookup',
  description: 'Real-time LinkedIn company lookup by LinkedIn URL',
  audience: 'both',
  aiMetadata: {
    description:
      'Resolve a company profile in real time directly from its LinkedIn company URL. Read-only and repeatable. Use when you only have a LinkedIn URL and want fresh data; prefer Lookup Company when you have a domain or internal ID, since this path triggers a live LinkedIn fetch.',
    idempotent: true,
  },
  props: {
    linkedin_url: Property.ShortText({
      displayName: 'LinkedIn URL',
      required: true,
      description: 'Company LinkedIn profile URL',
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      linkedin_url: context.propsValue.linkedin_url,
    };
    return await pubrioRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/companies/linkedin/lookup',
      body
    );
  },
});
