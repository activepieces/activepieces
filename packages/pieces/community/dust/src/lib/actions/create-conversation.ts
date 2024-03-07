import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import {
  DUST_BASE_URL,
  assistantProp,
  usernameProp,
  timezoneProp,
  getConversationContent,
} from '../common';
import { dustAuth } from '../..';

export const createConversation = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createConversation',
  displayName: 'Create conversation',
  description: 'Create a new conversation with a specific Dust assistant',
  auth: dustAuth,
  props: {
    assistant: assistantProp,
    username: usernameProp,
    timezone: timezoneProp,
    query: Property.LongText({ displayName: 'Query', required: true }),
  },
  async run({ auth, propsValue }) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${DUST_BASE_URL}/${auth.workspaceId}/assistant/conversations`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.apiKey}`,
      },
      body: JSON.stringify(
        {
          visibility: 'unlisted',
          title: null,
          message: {
            content: propsValue.query,
            mentions: [{ configurationId: propsValue.assistant }],
            context: {
              timezone: propsValue.timezone,
              username: propsValue.username,
              email: null,
              fullName: null,
              profilePictureUrl: null,
            },
          },
        },
        (key, value) => (typeof value === 'undefined' ? null : value)
      ),
    };
    const body = (await httpClient.sendRequest(request)).body;
    const conversationId = body['conversation']['sId'];
    return await getConversationContent(conversationId, auth);
  },
});
