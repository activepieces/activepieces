import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findConversation = createAction({
  auth: frontAuth,
  name: 'findConversation',
  displayName: 'Find Conversation',
  description: 'Find a conversation by search filters such as subject, participants, tags, inbox, etc.',
  props: {
    q: Property.ShortText({
      displayName: 'Query',
      description: 'Front query string (e.g. subject:"Order", tag_ids:tag_123, inbox_id:inb_456, etc.). See https://dev.frontapp.com/docs/search-1',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of conversations to return.',
      required: false,
    }),
    page_token: Property.ShortText({
      displayName: 'Page Token',
      description: 'Token for pagination.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { q, limit, page_token } = propsValue;
    const params: string[] = [];
    if (q) params.push(`q=${encodeURIComponent(q)}`);
    if (limit) params.push(`limit=${limit}`);
    if (page_token) params.push(`page_token=${encodeURIComponent(page_token)}`);
    const queryString = params.length ? `?${params.join('&')}` : '';
    const path = `/conversations/search${queryString}`;
    return await makeRequest(auth.access_token, HttpMethod.GET, path);
  },
});