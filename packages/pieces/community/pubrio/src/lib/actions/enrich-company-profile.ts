import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const enrichCompanyProfile = createAction({
  auth: pubrioAuth,
  name: 'enrich_company_profile',
  displayName: 'Enrich Company Profile',
  description: 'Enrich one known company into a full firmographic profile (uses credits)',
  audience: 'ai',
  aiMetadata: {
    description:
      'Enrich one known company (by domain, LinkedIn URL, `domain_search_id`, or numeric `domain_id`) into a full firmographic profile. **Consumes account credits** but is read-only and safe to repeat. Pick this when you have one company identifier and want its full detail; use Find Companies to discover companies by criteria, or Lookup Company Technologies for just the tech stack.',
    idempotent: true,
  },
  props: {
    lookup_type: Property.StaticDropdown({
      displayName: 'Lookup Type',
      required: true,
      options: {
        options: [
          { label: 'Domain', value: 'domain' },
          { label: 'LinkedIn URL', value: 'linkedin_url' },
          { label: 'Domain Search ID', value: 'domain_search_id' },
          { label: 'Domain ID', value: 'domain_id' },
        ],
      },
    }),
    value: Property.ShortText({
      displayName: 'Value',
      required: true,
      description:
        'Domain, LinkedIn URL, Domain Search ID, or Domain ID (integer)',
    }),
  },
  async run(context) {
    const lookupType = context.propsValue.lookup_type;
    const rawValue = context.propsValue.value;
    let lookupValue: string | number = rawValue;
    if (lookupType === 'domain_id') {
      const parsed = parseInt(rawValue, 10);
      if (isNaN(parsed)) {
        throw new Error(
          `domain_id must be a valid integer, got: "${rawValue}"`
        );
      }
      lookupValue = parsed;
    }
    const body: Record<string, unknown> = {
      [lookupType]: lookupValue,
    };
    return await pubrioRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/companies/lookup/enrich',
      body
    );
  },
});
