import { createAction, Property } from '@activepieces/pieces-framework';
import { dataforb2bAuth, dataForB2BRequest } from '../common';

export const enrichCompany = createAction({
  auth: dataforb2bAuth,
  name: 'enrich_company',
  displayName: 'Enrich Company',
  description: 'Retrieve comprehensive information about a company.',
  audience: 'both',
  aiMetadata: {
    description: 'Look up one company in the DataForB2B database by slug, LinkedIn company URL, or encoded company ID, returning its full firmographic record. Use when you already hold a company identifier; use Search Companies to find companies by criteria, or Typeahead to resolve a company name to its stored identifier first. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    companyIdentifier: Property.ShortText({
      displayName: 'Company Identifier',
      description: 'Company slug, LinkedIn URL, or encoded ID',
      required: true,
    }),
  },
  async run(context) {
    const { companyIdentifier } = context.propsValue;
    return dataForB2BRequest(context.auth.secret_text, '/enrich/company', {
      company_identifier: companyIdentifier,
    });
  },
});
