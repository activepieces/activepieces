import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { valyuAuth } from '../auth';

export const listDatasourcesAction = createAction({
  name: 'list_datasources',
  displayName: 'List Datasources',
  description: 'List all available datasources with metadata, schemas, and pricing. Useful for discovering available data sources.',
  audience: 'both',
  aiMetadata: { description: 'Lists the Valyu datasources available to the account, with their metadata, schemas, and pricing, optionally filtered by category. Use to discover which proprietary data sources exist before scoping a search or research task. Read-only listing, so repeating the call is safe.', idempotent: true },
  auth: valyuAuth,
  props: {
    category: Property.StaticDropdown({
      displayName: 'Category',
      description: 'Filter datasources by category.',
      required: false,
      options: {
        options: [
          { label: 'All', value: '' },
          { label: 'Research & Academic', value: 'research' },
          { label: 'Healthcare', value: 'healthcare' },
          { label: 'Patents', value: 'patents' },
          { label: 'Financial Markets', value: 'markets' },
          { label: 'Company', value: 'company' },
          { label: 'Economic', value: 'economic' },
          { label: 'Predictions', value: 'predictions' },
          { label: 'Transportation', value: 'transportation' },
          { label: 'Legal', value: 'legal' },
          { label: 'Politics', value: 'politics' },
        ],
      },
    }),
  },
  async run(context) {
    const apiKey = context.auth;

    const queryParams: Record<string, string> = {};
    if (context.propsValue['category']) {
      queryParams['category'] = context.propsValue['category'];
    }

    const queryString = Object.keys(queryParams).length > 0
      ? '?' + new URLSearchParams(queryParams).toString()
      : '';

    const response = await makeRequest(apiKey.secret_text, HttpMethod.GET, `/v1/datasources${queryString}`);
    return response;
  },
});
