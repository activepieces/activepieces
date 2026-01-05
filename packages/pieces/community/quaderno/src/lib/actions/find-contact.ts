import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { quadernoAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const findContact = createAction({
  auth: quadernoAuth,
  name: 'findContact',
  displayName: 'Find Contact',
  description: 'Search and list contacts from Quaderno',
  props: {
    searchQuery: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search for contacts by name, email, or tax ID (optional)',
      required: false,
    }),
    processorId: Property.ShortText({
      displayName: 'Processor ID',
      description: 'Filter by processor ID (optional)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Results Limit',
      description:
        'Maximum number of results to return (default: 25, max: 100)',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const params = new URLSearchParams();

    if (context.propsValue.searchQuery) {
      params.append('q', context.propsValue.searchQuery);
    }

    if (context.propsValue.processorId) {
      params.append('processor_id', context.propsValue.processorId);
    }

    if (context.propsValue.limit) {
      params.append('limit', context.propsValue.limit.toString());
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/contacts?${queryString}` : '/contacts';

    return await makeRequest(
      context.auth.props.account_name,
      context.auth.props.api_key,
      HttpMethod.GET,
      endpoint
    );
  },
});
