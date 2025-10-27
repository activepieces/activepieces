import { createAction, Property } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';

export const findPerson = createAction({
  auth: folkAuth,
  name: 'findPerson',
  displayName: 'Find Person',
  description: 'Search for people in your Folk workspace by name or email address.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Enter person name or email to search for',
      required: true,
    }),
  },
  async run(context) {
    const { query } = context.propsValue;

    const response = await folkClient.searchPerson({
      apiKey: context.auth,
      query,
    });

    return {
      people: response.people || [],
      count: response.people?.length || 0,
    };
  },
});

