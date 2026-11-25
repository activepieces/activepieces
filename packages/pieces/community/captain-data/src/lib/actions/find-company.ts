import { createAction, Property } from '@activepieces/pieces-framework';
import { captainDataAuth } from '../auth';
import { captainDataClient, captainDataUtils } from '../common';

export const findCompany = createAction({
  name: 'find_company',
  classification: 'SEARCH',
  displayName: 'Find Company',
  description:
    'Finds a company by website domain or by name and returns its LinkedIn company URL. Fill exactly one of the two. Costs 2 credits. Fails with an error when no company matches.',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up one company by exactly one of domain (bare domain such as "activepieces.com") or company_name, and returns li_company_url and li_company_id. Costs 2 credits per call. When no company matches, the step fails with a Captain Data error (424 STATUS_404) rather than returning an empty result. Pass li_company_id to Find Company Employees as company_id, or li_company_url to Enrich Company.',
    idempotent: true,
  },
  auth: captainDataAuth,
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description:
        'Company website domain without scheme, e.g. "activepieces.com".',
      required: false,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Company name. Leave empty when Domain is set.',
      required: false,
    }),
  },
  outputSchema: {
    fields: [
      { key: 'li_company_url', label: 'LinkedIn Company URL', format: 'url' },
      { key: 'li_company_id', label: 'LinkedIn Company ID' },
      { key: 'extracted_at', label: 'Extracted At', format: 'datetime' },
    ],
  },
  async run({ auth, propsValue }) {
    const domain = captainDataUtils.optionalText({ value: propsValue.domain });
    const companyName = captainDataUtils.optionalText({
      value: propsValue.company_name,
    });
    if (domain && companyName) {
      throw new Error('Provide either Domain or Company Name, not both.');
    }
    if (!domain && !companyName) {
      throw new Error('Provide a Domain or a Company Name.');
    }
    return captainDataClient.getObject({
      apiKey: auth.props.apiKey,
      path: '/companies/find',
      operation: 'find company',
      queryParams: { domain, company_name: companyName },
    });
  },
});
