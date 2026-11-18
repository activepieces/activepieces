import { createAction, Property } from '@activepieces/pieces-framework';
import { hunterAuth } from '../auth';
import { apiKeyOf, requireText } from '../common/client';
import { hunterOutputSchemas } from '../common/output-schemas';
import { hunterRequests } from '../common/requests';

export const enrichCompanyAction = createAction({
  auth: hunterAuth,
  name: 'enrich_company',
  classification: 'READ',
  displayName: 'Enrich Company',
  description: 'Get company data (industry, size, location, tech) from a domain. Uses 0.2 credit per match.',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up a company by domain: name, description, industry, employee range, location, founding year, social handles and technologies. Returns found=false with company null when Hunter has no data. Costs 0.2 Hunter credit per match (none when not found). Read-only.',
    idempotent: true,
  },
  props: {
    domain: Property.ShortText({ displayName: 'Domain', required: true, description: 'Company domain, e.g. "stripe.com".' }),
  },
  outputSchema: hunterOutputSchemas.company,
  async run(context) {
    return hunterRequests.enrichCompany({ apiKey: apiKeyOf(context.auth), domain: requireText({ value: context.propsValue.domain, label: 'Domain' }) });
  },
});
