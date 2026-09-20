import { createAction, Property } from '@activepieces/pieces-framework';
import { neuralvergeAuth } from '../auth';
import { neuralvergeClient } from '../common/client';

export const findLinkedinProfileAction = createAction({
  auth: neuralvergeAuth,
  name: 'find_linkedin_profile',
  classification: 'SEARCH',
  displayName: 'Find LinkedIn Profile by Name and Company',
  description: 'Find a LinkedIn profile URL from a full name and a company name or domain. Cost: 10 points (1 point = $0.001).',
  audience: 'both',
  aiMetadata: {
    description: 'Resolve a person (full name + company name or domain) to their LinkedIn profile URL, headline and company. Use before Get LinkedIn Profile with Email when you only know the name. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    full_name: Property.ShortText({
      displayName: 'Full Name',
      description: 'Full name of the person, for example Jane Doe.',
      required: true,
    }),
    company_or_domain: Property.ShortText({
      displayName: 'Company or Domain',
      description: 'Company name or website domain, for example example.com.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return neuralvergeClient.post({
      apiKey: auth.secret_text,
      endpoint: 'run-linkedin-domain',
      body: {
        full_name: propsValue.full_name,
        company_or_domain: propsValue.company_or_domain,
      },
    });
  },
});
