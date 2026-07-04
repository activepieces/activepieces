import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../auth';
import { enrichlayerApiCall } from '../common/client';
import { ENDPOINTS } from '../common/constants';

export const getCompanyLookup = createAction({
  name: 'get_company_lookup',
  auth: enrichlayerAuth,
  displayName: 'Look Up Company',
  description:
    'Resolve a Company Profile from company name, domain, or location (2 credits)',
  audience: 'both',
  aiMetadata: {
    description:
      "Resolve a single company's professional-network URL/profile from its name or domain (one of the two is required), optionally narrowed by country. Read-only and safe to retry. Use this as the entry point when you only know a company name or domain; to find many companies by attributes use Search Companies, and to enrich an already-known URL use Get Company Profile.",
    idempotent: true,
  },
  props: {
    company_name: Property.ShortText({
      displayName: 'Company Name',
      description:
        'Name of the company. Requires either Company Name or Company Domain.',
      required: false,
    }),
    company_domain: Property.ShortText({
      displayName: 'Company Domain',
      description:
        'Company website or domain (e.g., accenture.com). Requires either Company Name or Company Domain.',
      required: false,
    }),
    company_location: Property.ShortText({
      displayName: 'Company Location',
      description: 'ISO 3166-1 alpha-2 country code (e.g., sg, us)',
      required: false,
    }),
    enrich_profile: Property.StaticDropdown({
      displayName: 'Enrich Profile',
      description:
        'Enrich the result with cached company profile data (+1 credit)',
      required: false,
      options: {
        options: [
          { label: 'Skip (default)', value: 'skip' },
          { label: 'Enrich (+1 credit)', value: 'enrich' },
        ],
      },
    }),
  },
  async run(context) {
    return await enrichlayerApiCall(
      context.auth.secret_text as string,
      ENDPOINTS.COMPANY_LOOKUP,
      {
        company_name: context.propsValue.company_name,
        company_domain: context.propsValue.company_domain,
        company_location: context.propsValue.company_location,
        enrich_profile: context.propsValue.enrich_profile,
      },
    );
  },
});
