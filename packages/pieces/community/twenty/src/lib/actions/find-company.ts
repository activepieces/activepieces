import { createAction, Property } from '@activepieces/pieces-framework';
import { twentyAuth } from '../auth';
import { twentyApi } from '../common/api';
import { findCompanyOutputSchema } from '../output-schemas';

export const findCompanyAction = createAction({
  auth: twentyAuth,
  name: 'find_company',
  outputSchema: findCompanyOutputSchema,
  classification: 'SEARCH',
  displayName: 'Find Company',
  description: 'Searches for company records in Twenty CRM.',
  audience: 'human',
  aiMetadata: { description: 'Looks up company records in Twenty CRM, optionally filtering by an exact-match company name and/or domain. Use to resolve a company to its record ID before updating or linking, or to check existence; leaving both filters empty returns all companies. Idempotent: a read-only query with no side effects.', idempotent: true },
  props: {
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Filter by company name.',
      required: false,
    }),
    domainName: Property.ShortText({
      displayName: 'Domain Name',
      description: 'Filter by domain (e.g. acme.com).',
      required: false,
    }),
  },
  async run(context) {
    const { name, domainName } = context.propsValue;

    return await twentyApi.findCompanies({
      auth: context.auth,
      name,
      domainName,
    });
  },
});
