import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';

export const findCompany = createAction({
  auth: folkAuth,
  name: 'findCompany',
  displayName: 'Find Company',
  description: 'Search for companies in your Folk workspace by name or email address.',
  audience: 'both',
  aiMetadata: {
    description: 'Searches the Folk CRM for companies matching a query string against company name or email, returning the matching companies. Use to resolve a company name or email into a company ID before updating or linking it. The search query is required. Read-only and idempotent: repeating the same query returns the same matches without side effects.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Enter company name or email to search for',
      required: true,
    }),
  },
  async run(context) {
    const { query } = context.propsValue;

    const response = await folkClient.searchCompany({
      apiKey: context.auth,
      query,
    });

    return {
      companies: response.data?.items || [],
      count: response.data?.items?.length || 0,
      pagination: response.data?.pagination,
    };
  },
});

