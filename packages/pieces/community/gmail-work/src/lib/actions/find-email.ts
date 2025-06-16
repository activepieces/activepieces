import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../index';    
import { gmailCommon } from '../common/common';


export const findEmail = createAction({
  auth: gmailAuth,
  name: 'find_email',
  displayName: 'Find Email',
  description: 'Search for emails using Gmail search syntax',
  props: {
    query: Property.LongText({
      displayName: 'Search Query',
      description: 'Gmail search query (e.g., "from:example@gmail.com subject:important")',
      required: true,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of results to return (default: 10)',
      required: false,
      defaultValue: 10,
    }),
    includeSpamTrash: Property.Checkbox({
      displayName: 'Include Spam and Trash',
      description: 'Include results from Spam and Trash folders',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { query, maxResults, includeSpamTrash } = propsValue;
    
    const searchParams = new URLSearchParams({
      q: query,
      maxResults: (maxResults || 10).toString(),
      includeSpamTrash: includeSpamTrash ? 'true' : 'false',
    });
    
    const searchResponse = await gmailCommon.makeRequest(
      auth.access_token,
      'GET',
      `/users/me/messages?${searchParams.toString()}`
    );
    
    if (!searchResponse.messages || searchResponse.messages.length === 0) {
      return { messages: [], resultCount: 0 };
    }
    
    // Get full message details for each result
    const detailedMessages = await Promise.all(
      searchResponse.messages.map(async (msg: any) => {
        return gmailCommon.getMessage(auth.access_token, msg.id);
      })
    );
    
    return {
      messages: detailedMessages,
      resultCount: searchResponse.resultSizeEstimate || detailedMessages.length,
    };
  },
});