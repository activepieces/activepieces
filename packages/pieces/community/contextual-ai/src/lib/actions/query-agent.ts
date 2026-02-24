import { createAction, Property } from "@activepieces/pieces-framework";
import { contextualAiAuth } from "../../index";
import { ContextualAI } from 'contextual-client';
import type { Agent } from 'contextual-client/resources/agents';

export const queryAgentAction = createAction({
  auth: contextualAiAuth,
  name: 'query_agent',
  displayName: 'Query Agent',
  description: 'Send a message to a Contextual AI agent and get a response',
  props: {
    agentId: Property.Dropdown({
      auth: contextualAiAuth,
      displayName: 'Agent',
      description: 'Select the agent to query',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        try {
          if (!auth) {
            return {
              disabled: true,
              options: [],
              placeholder: 'Please connect your account first',
            };
          }
          const { apiKey, baseUrl } = auth.props;
          const client = new ContextualAI({
            apiKey: apiKey,
            baseURL: baseUrl || 'https://api.contextual.ai/v1',
          });

          const allAgents: Agent[] = [];
          for await (const agent of client.agents.list()) {
            allAgents.push(agent);
          } 

          return {
            options: allAgents.map((agent: Agent) => ({
              label: agent.name,
              value: agent.id,
            })),
          };
        } catch (error) {
          return {
            options: [],
            error: 'Failed to fetch agents. Please check your API key.',
          };
        }
      },
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The message to send to the agent',
      required: true,
    }),
    conversationId: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'Optional conversation ID to continue an existing conversation (leave empty for new conversation)',
      required: false,
    }),
    includeRetrievalContent: Property.Checkbox({
      displayName: 'Include Retrieval Content',
      description: 'Include the text of retrieved contents in the response',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { apiKey, baseUrl } = auth.props;
    const { agentId, message, conversationId, includeRetrievalContent } = propsValue;

    const client = new ContextualAI({
      apiKey: apiKey,
      baseURL: baseUrl || 'https://api.contextual.ai/v1',
    });

    const messages: Array<{ role: 'user' | 'system' | 'assistant' | 'knowledge'; content: string }> =
      conversationId ? [] : [{ role: 'user' as const, content: message }];

    const response = await client.agents.query.create(agentId, {
      messages: messages,
      conversation_id: conversationId,
      include_retrieval_content_text: includeRetrievalContent,
    });

    return {
      conversation_id: response.conversation_id,
      message: response.message,
      retrieval_contents: response.retrieval_contents,
      attributions: response.attributions,
      groundedness_scores: response.groundedness_scores,
      message_id: response.message_id,
    };
  },
});
