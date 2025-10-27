import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';

export const findCompany = createAction({
  auth: folkAuth,
  name: 'findCompany',
  displayName: 'Find Company',
  description: 'Search for companies in your Folk workspace by name or email address.',
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
      companies: response.companies || [],
      count: response.companies?.length || 0,
    };
  },
});

