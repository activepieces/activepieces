import { straicoAuth } from '../auth';
import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { baseUrlv0, baseUrlv1 } from '../common/common';
import { agentIdDropdown } from '../common/props';

interface AgentUpdateRequestBody {
  name?: string;
  description?: string;
  custom_prompt?: string;
  default_llm?: string;
  status?: 'active' | 'inactive';
  visibility?: 'private' | 'public';
}

interface AgentUpdateResponse {
  _id: string;
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
  createdAt: string;
  updatedAt: string;
  __v: number;
  rag_association?: string;
}

export const agentUpdate = createAction({
  audience: 'both',
  auth: straicoAuth,
  name: 'agent_update',
  displayName: 'Update Agent',
  description: "Change an agent's details, model or status.",
  aiMetadata: { description: 'Edits an existing Straico agent in place, changing any subset of its name, description, custom prompt, default LLM, status (active or inactive) and visibility (private or public). Use it to retune or pause an agent instead of recreating it with Create Agent, and use Add RAG to Agent when the change is attaching a knowledge base rather than editing these fields. Requires the agent id plus at least one field to change, otherwise the call fails. Idempotent: sending the same values leaves the agent in the same state.', idempotent: true },
  propertyGroups: [
    {
      key: 'target',
      display: 'section',
      label: 'Agent to Update',
      icon: 'user',
      props: ['agentId'],
    },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'sliders',
      props: ['changesInfo', 'name', 'description', 'customPrompt', 'defaultLlm', 'status', 'visibility'],
    },
  ],
  props: {
    agentId: agentIdDropdown('Agent','The agent to change.'),
    changesInfo: Property.MarkDown({
      value: 'Only the fields you fill in are changed.',
      variant: MarkdownVariant.INFO,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
      description: "The agent's new name.",
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
      description: "The agent's new description.",
    }),
    customPrompt: Property.LongText({
      displayName: 'Instructions',
      required: false,
      description: 'New instructions for the agent.',
    }),
    defaultLlm: Property.Dropdown({
  auth: straicoAuth,

      displayName: 'Default LLM',
      required: false,
      description: 'The chat model the agent uses.',
      refreshers: ['auth'],
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
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      description: 'Whether the agent is active.',
      width: 'half',
      options:  {
        disabled:false,
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ],
        
      },
    }),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      required: false,
      description: 'Who can see the agent.',
      width: 'half',
      options:  {
        disabled:false,
          options: [
            { label: 'Private', value: 'private' },
            { label: 'Public', value: 'public' },
          ],
        
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { 
      agentId, 
      name, 
      description, 
      customPrompt, 
      defaultLlm, 
      status, 
      visibility 
    } = propsValue;

    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    const requestBody: AgentUpdateRequestBody = {};
    
    if (name !== undefined && name !== '') requestBody.name = name;
    if (description !== undefined && description !== '') requestBody.description = description;
    if (customPrompt !== undefined && customPrompt !== '') requestBody.custom_prompt = customPrompt;
    if (defaultLlm !== undefined && defaultLlm !== '') requestBody.default_llm = defaultLlm;
    if (status !== undefined && status !== '') requestBody.status = status as 'active' | 'inactive';
    if (visibility !== undefined && visibility !== '') requestBody.visibility = visibility as 'private' | 'public';

    if (Object.keys(requestBody).length === 0) {
      throw new Error('At least one property to update must be provided');
    }

    const response = await httpClient.sendRequest<{
      success: boolean;
      data: AgentUpdateResponse;
    }>({
      url: `${baseUrlv0}/agent/${agentId}`,
      method: HttpMethod.PUT,
      body: requestBody,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
    });

    return response.body.data;
  },
});
