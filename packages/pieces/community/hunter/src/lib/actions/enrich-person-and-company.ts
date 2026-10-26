import { createAction, Property } from '@activepieces/pieces-framework';
import { hunterAuth } from '../auth';
import { apiKeyOf, requireText } from '../common/client';
import { hunterOutputSchemas } from '../common/output-schemas';
import { hunterRequests } from '../common/requests';

export const enrichPersonAndCompanyAction = createAction({
  auth: hunterAuth,
  name: 'enrich_person_and_company',
  classification: 'READ',
  displayName: 'Enrich Person and Company',
  description: 'Get profile data about a person and their company from an email. Uses 0.2 credit per match.',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up a person and their company from an email address: name, location, employment (title, role, seniority), social handles, and company details (industry, size, location, tech). Returns found=false with null person and company when Hunter has no data. Costs 0.2 Hunter credit per match (none when not found). Read-only.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({ displayName: 'Email', required: true, description: 'Email address of the person to look up.' }),
  },
  outputSchema: hunterOutputSchemas.personAndCompany,
  async run(context) {
    return hunterRequests.enrichPersonAndCompany({ apiKey: apiKeyOf(context.auth), email: requireText({ value: context.propsValue.email, label: 'Email' }) });
  },
});
