import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { kommoAuth } from '../auth';

export const findCompanyAction = createAction({
  auth: kommoAuth,
  name: 'find_company',
  displayName: 'Find Company',
  description: 'Find an existing company.',
  audience: 'both',
  aiMetadata: { description: 'Searches companies in a Kommo CRM account by a free-text query matched against the companies\' filled fields, returning all matching companies. Use to resolve a company record (e.g. by name) before referencing or linking it; the query is required. Read-only and idempotent.', idempotent: true },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      required: true,
      description: 'Search query (Searches through the filled fields of the company).'
    }),
  },
  async run(context) {
    const { query } = context.propsValue;
    const { subdomain, apiToken } = context.auth.props

    const result = await makeRequest(
      { apiToken, subdomain },
      HttpMethod.GET,
      `/companies?query=${encodeURIComponent(query || '')}`
    );

    const companies = result?._embedded?.companies ?? [];

    return {
      found: companies.length > 0,
      result: companies
    };
  },
});
