import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BASE_URL, personalAiAuth } from '../../../index';

export const getConversation = createAction({
  auth:personalAiAuth,
  name: 'get_conversation',
  displayName: 'Get Conversation History',
  description: 'Retrieve conversation history from AI assistant.',
  // category: 'Messaging',
  props: {
    channelId: Property.ShortText({
      displayName: 'Channel ID',
      description: 'The unique identifier for the conversation channel',
      required: true,
    }),
    domainName: Property.ShortText({
      displayName: 'Domain Name',
      description: 'The domain identifier for the AI profile',
      required: false,
    }),
    userName: Property.ShortText({
      displayName: 'User Name',
      description: 'Name of the user requesting the conversation',
      required: false,
    }),
    sessionId: Property.ShortText({
      displayName: 'Session ID',
      description: 'Filter conversation by specific session ID',
      required: false,
    }),
    sourceName: Property.ShortText({
      displayName: 'Source Name',
      description: 'Filter conversation by source application',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of messages to return',
      required: false,
    }),
    skip: Property.Number({
      displayName: 'Skip',
      description: 'Number of messages to skip (for pagination)',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue: { channelId, domainName, userName, sessionId, sourceName, limit, skip } } = context;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/v1/conversation`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': auth as string,
      },
      body: {
        ChannelId: channelId,
        ...(domainName && { DomainName: domainName }),
        ...(userName && { UserName: userName }),
        ...(sessionId && { SessionId: sessionId }),
        ...(sourceName && { SourceName: sourceName }),
        ...(limit !== undefined && { Limit: limit }),
        ...(skip !== undefined && { Skip: skip }),
      },
    });

    return response.body;
  },
});
