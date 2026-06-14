import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { gmailMcpAuth } from '../common/auth';
import { gmailRequest } from '../common/gmail-api';

export const searchEmails = createAction({
  auth: gmailMcpAuth,
  name: 'gmail_mcp_search_emails',
  displayName: 'Search Emails',
  description: 'Search emails using Gmail query syntax',
  props: {
    query: Property.ShortText({ displayName: 'Search Query', description: 'Gmail search query (e.g., "from:user@example.com subject:hello")', required: true }),
    maxResults: Property.Number({ displayName: 'Max Results', required: false, defaultValue: 10 }),
  },
  async run(context) {
    const { query, maxResults } = context.propsValue;
    return await gmailRequest(context.auth.access_token, HttpMethod.GET, `/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults ?? 10}`);
  },
});
