import { createAction, Property } from '@activepieces/pieces-framework';
import { promptxAuth } from '../common/auth';
import {
  createConversation,
  fetchAgents,
  getAgentXToken,
} from '../common/helper';
import { PromptXAuthType } from '../common/types';

export const createConversationAction = createAction({
  auth: promptxAuth,
  name: 'createConversation',
  displayName: 'Create Conversation',
  description: 'Create a new conversation with an agent',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Conversation title',
      required: true,
    }),
    slug: Property.ShortText({
      displayName: 'Slug',
      description:
        'Conversation slug / key which can be used to ensure a single conversation is used while interacting with the agent',
      required: false,
    }),
    agentId: Property.Dropdown({
      displayName: 'Agent',
      description: 'Agent that you would like to converse with',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        const promptXAuth = auth as PromptXAuthType;
        const agentXToken = await getAgentXToken(promptXAuth);
        const agents = await fetchAgents({
          ...promptXAuth,
          agentXToken,
        });
        return {
          disabled: false,
          options: agents.map((agent) => {
            return {
              label: agent.name,
              value: agent.id,
            };
          }),
        };
      },
    }),
  },
  async run({ auth, propsValue }) {
    const promptXAuth = auth as PromptXAuthType;
    const agentXToken = await getAgentXToken(promptXAuth);
    const conversation = await createConversation(
      { ...promptXAuth, agentXToken },
      propsValue
    );
    return conversation;
  },
});
