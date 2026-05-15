import { createAction, Property } from '@activepieces/pieces-framework';
import { frillAuth } from '../../';
import { frillDropdowns, frillPaginatedApiCall, flattenObject } from '../common';

export const getIdeas = createAction({
  auth: frillAuth,
  name: 'get_ideas',
  displayName: 'Get Ideas',
  description: 'Fetch a list of ideas/feedback entries from Frill.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of ideas to return (max 100).',
      required: false,
      defaultValue: 20,
    }),
    status: frillDropdowns.statusDropdown,
  },
  async run(context) {
    const queryParams: Record<string, string | number | boolean | undefined> = {
      limit: context.propsValue.limit ?? 20,
    };
    if (context.propsValue.status) {
      queryParams.status = context.propsValue.status;
    }

    const ideas = await frillPaginatedApiCall<Record<string, unknown>>({
      token: context.auth as string,
      path: '/ideas',
      queryParams,
      limit: context.propsValue.limit ?? 20,
    });

    return ideas.map((idea) => flattenObject(idea));
  },
});
