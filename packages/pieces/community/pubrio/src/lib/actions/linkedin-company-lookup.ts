import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const linkedinCompanyLookup = createAction({
  auth: pubrioAuth,
  name: 'linkedin_company_lookup',
  displayName: 'Company LinkedIn Lookup',
  description: 'Real-time LinkedIn company lookup by LinkedIn URL',
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
