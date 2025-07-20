import { straicoAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

import { baseUrlv0 } from '../common/common';
import { agentIdDropdown } from '../common/props';

interface AgentAddRagResponse {
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
  };
}

export const agentAddRag = createAction({
  auth: straicoAuth,
  name: 'agent-add-rag',
  displayName: 'Add RAG to Agent',
  description: 'Adds a new RAG to an agent in the database for the user.',
  props: {
    agent_id: agentIdDropdown('Agent','The agent to add the RAG to.'),
    rag_id: Property.Dropdown({
      displayName: 'RAG ID',
      required: true,
      description: 'The ID of the RAG to add to the agent',
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Enter your API key first',
            options: [],
          };
        }
        try {
          const rags = await httpClient.sendRequest<{
            success: boolean;
            data: Array<{
              _id: string;
              name: string;
            }>;
          }>({
            url: `${baseUrlv0}/rag/user`,
            method: HttpMethod.GET,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: auth as string,
            },
          });
          return {
            disabled: false,
            options:
              rags.body?.data?.map((rag) => {
                return {
                  label: rag.name,
                  value: rag._id,
                };
              }) || [],
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: "Couldn't load RAGs, API key is invalid",
          };
        }
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { agent_id, rag_id } = propsValue;
  
    const response = await httpClient.sendRequest<AgentAddRagResponse>({
      url: `${baseUrlv0}/agent/${agent_id}/rag`,
      method: HttpMethod.POST,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth as string,
      },
      body: {
        rag: rag_id,
      },
    });

    return response.body;
  },
});
