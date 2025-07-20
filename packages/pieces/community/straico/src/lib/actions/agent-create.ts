import { straicoAuth } from '../../index';
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
  auth: straicoAuth,
  name: 'agent-create',
  displayName: 'Create Agent',
  description: 'Creates a new agent in the database for the user.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
      description: 'A name for the agent',
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: true,
      description: 'A brief description of what the model does',
    }),
    custom_prompt: Property.LongText({
      displayName: 'Custom Prompt',
      required: true,
      description: 'A model that the agent will use for processing prompts',
    }),
    default_llm: Property.Dropdown({
      displayName: 'Default LLM',
      required: true,
      description: 'The language model which the agent will use for processing prompts',
      refreshers: [],
      defaultValue: 'openai/gpt-4o-mini',
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Enter your API key first',
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
              token: auth as string,
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
      description: 'An array of tags for the agent. Example: ["assistant","tag"]',
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
        token: auth as string,
      },
      body: requestBody,
    });

    return response.body;
  },
});