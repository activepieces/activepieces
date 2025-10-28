import { straicoAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { baseUrlv0, baseUrlv1 } from '../common/common';

// Interface for agent update request body
interface AgentUpdateRequestBody {
  name?: string;
  description?: string;
  custom_prompt?: string;
  default_llm?: string;
  status?: 'active' | 'inactive';
  visibility?: 'private' | 'public';
}

// Interface for agent update response data
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
  auth: straicoAuth,
  name: 'agent_update',
  displayName: 'Update Agent',
  description: 'Update the details of a specific agent',
  props: {
    agentId: Property.Dropdown({
      displayName: 'Agent',
      required: true,
      description: 'Select the agent to update',
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }

        const response = await httpClient.sendRequest<{
          success: boolean;
          data: Array<{
            _id: string;
            name: string;
          }>;
        }>({
          url: `${baseUrlv0}/agent`,
          method: HttpMethod.GET,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth as string,
          },
        });

        if (response.body.success && response.body.data) {
          return {
            options: response.body.data.map((agent) => {
              return {
                label: agent.name,
                value: agent._id,
              };
            }),
          };
        }

        return {
          disabled: true,
          placeholder: 'No agents found',
          options: [],
        };
      },
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
      description: 'New name for the agent',
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
      description: 'New description for the agent',
    }),
    customPrompt: Property.LongText({
      displayName: 'Custom Prompt',
      required: false,
      description: 'New custom prompt for the agent',
    }),
    defaultLlm: Property.Dropdown({
      displayName: 'Default LLM',
      required: false,
      description: 'New default LLM for the agent',
      refreshers: ['auth'],
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
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      description: 'New status for the agent',
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
      description: 'New visibility setting for the agent',
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
    
    // Add properties to request body only if they are defined
    if (name !== undefined) requestBody.name = name;
    if (description !== undefined) requestBody.description = description;
    if (customPrompt !== undefined) requestBody.custom_prompt = customPrompt;
    if (defaultLlm !== undefined) requestBody.default_llm = defaultLlm;
    if (status !== undefined) requestBody.status = status as 'active' | 'inactive';
    if (visibility !== undefined) requestBody.visibility = visibility as 'private' | 'public';

    // Only proceed if at least one property to update was provided
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
        token: auth as string,
      },
    });

    return response.body.data;
  },
});
