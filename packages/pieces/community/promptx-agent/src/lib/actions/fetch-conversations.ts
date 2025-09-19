import { createAction, Property } from '@activepieces/pieces-framework';
import { promptxAuth } from '../common/auth';
import { fetchConversations, getAgentXToken } from '../common/helper';
import { PromptXAuthType } from '../common/types';

export const fetchConversationsAction = createAction({
  auth: promptxAuth,
  name: 'fetchConversations',
  displayName: 'Fetch Conversations',
  description: 'Fetch list of conversations by the user',
  props: {
    slug: Property.ShortText({
      displayName: 'Slug',
      description:
        'The slug / key of the conversation to search for. Returns empty list if it does not exist',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const promptXAuth = auth as PromptXAuthType;
    const agentXToken = await getAgentXToken(promptXAuth);
    const conversations = await fetchConversations(
      { ...promptXAuth, agentXToken },
      propsValue
    );
    return conversations;
  },
});
