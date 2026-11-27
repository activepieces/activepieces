import { straicoAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

import { baseUrlv0, baseUrlv1 } from '../common/common';

interface AgentCreateRequest {
  name: string;
  description: string;
  custom_prompt: string;
  default_llm: string;
  tags?: string[];
}

interface AgentCreateResponse {
  success: boolean;
  data: {
    uuid4: string;
    user_id: string;
    default_llm: string;
    custom_prompt: string;
    name: string;
    description: string;
    status: string;
    tags: string[];
    last_interaction: null | string;
    interaction_count: number;
    visibility: string;
    _id: string;
    __v: number;
  };
}

export const agentCreate = createAction({
  audience: 'both',
  auth: straicoAuth,
  name: 'agent-create',
  displayName: 'Create Agent',
  description: 'Create a reusable agent with its own instructions and model.',
  aiMetadata: { description: 'Registers a new reusable Straico agent, a stored persona pairing a custom system prompt with a default chat LLM and optional tags, and returns its id for later prompting. Use it once when a persona should persist across runs; prefer Ask AI for a throwaway completion, Update Agent to change one that already exists, and Add RAG to Agent afterwards to ground it in documents. Requires a name, description, custom prompt and default LLM; it does not attach any knowledge base by itself. Not idempotent: each call creates another agent, duplicate names included.', idempotent: false },
  propertyGroups: [
    {
      key: 'agent',
      display: 'section',
      label: 'Agent',
      icon: 'user',
      props: ['name', 'description', 'tags'],
    },
    {
      key: 'behaviour',
      display: 'section',
      label: 'Behavior',
      icon: 'text',
      props: ['default_llm', 'custom_prompt'],
    },
  ],
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
      description: 'A name to find the agent by.',
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: true,
      description: 'What the agent is for.',
    }),
    custom_prompt: Property.LongText({
      displayName: 'Instructions',
      required: true,
      description: 'What the agent should always do, like a system prompt.',
    }),
    default_llm: Property.Dropdown({
  auth: straicoAuth,

      displayName: 'Default LLM',
      required: true,
      description: 'The chat model the agent uses.',
      refreshers: [],
      defaultValue: 'openai/gpt-4o-mini',
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Straico account first',
            options: [],
          };
        }
        try {
          const models = await httpClient.sendRequest<{
            data: {
              chat: Array<{
                name: string;
                model: string;
              }>;
            };
          }>({
            url: `${baseUrlv1}/models`,
            method: HttpMethod.GET,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: auth.secret_text,
            },
          });
          return {
            disabled: false,
            options:
              models.body?.data?.chat?.map((model) => {
                return {
                  label: model.name,
                  value: model.model,
                };
              }) || [],
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: "Couldn't load models, API key is invalid",
          };
        }
      },
    }),
    tags: Property.Array({
      displayName: 'Tags',
      required: false,
      description: 'Labels to organize your agents.',
    }),
  },
  async run({ auth, propsValue }) {
    const { name, description, custom_prompt, default_llm, tags } = propsValue;
    
    const requestBody: AgentCreateRequest = {
      name,
      description,
      custom_prompt,
      default_llm,
      tags: tags as string[],
    };
  
    const response = await httpClient.sendRequest<AgentCreateResponse>({
      url: `${baseUrlv0}/agent`,
      method: HttpMethod.POST,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
      body: requestBody,
    });

    return response.body;
  },
});