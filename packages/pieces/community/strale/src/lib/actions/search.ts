import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { straleAuth } from '../auth';

export const searchCapabilities = createAction({
  name: 'search_capabilities',
  auth: straleAuth,
  displayName: 'Search Capabilities',
  description:
    'Search 271 API capabilities by keyword, category, or natural language query. Returns matching capabilities with slug, description, price, and quality score. No API key required.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description:
        'Keyword or natural language description (e.g. "validate IBAN", "company data Sweden", "sanctions check")',
      required: true,
    }),
    category: Property.StaticDropdown({
      displayName: 'Category',
      description: 'Filter results by category',
      required: false,
      options: {
        options: [
          { label: 'All Categories', value: '' },
          { label: 'Compliance', value: 'compliance' },
          { label: 'Company Data', value: 'company-data' },
          { label: 'Financial', value: 'financial' },
          { label: 'Validation', value: 'validation' },
          { label: 'Web Intelligence', value: 'web-intelligence' },
          { label: 'Developer Tools', value: 'developer-tools' },
          { label: 'Security', value: 'security' },
          { label: 'Web3', value: 'web3' },
          { label: 'Data Processing', value: 'data-processing' },
        ],
      },
    }),
  },
  async run(context) {
    const { query, category } = context.propsValue;
    const params = new URLSearchParams({ q: query, limit: '10' });
    if (category) params.set('category', category);
    const response = await httpClient.sendRequest({
      url: `https://api.strale.io/v1/suggest/typeahead?${params}`,
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN as const,
        token: context.auth.secret_text,
      },
    });
    return response.body;
  },
});
