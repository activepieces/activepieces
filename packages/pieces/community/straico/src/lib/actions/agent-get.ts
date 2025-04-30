import { straicoAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { baseUrlv0 } from '../common/common';

interface AgentGetResponse {
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
  rag_association?: string;
}

export const agentGet = createAction({
  auth: straicoAuth,
  name: 'agent_get',
  displayName: 'Get Agent Details',
  description: 'Retrieve details of a specific agent',
  props: {
    agentId: Property.Dropdown({
      displayName: 'Agent',
      required: true,
      description: 'Select the agent to get details for',
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
  },
  async run({ auth, propsValue }) {
    const { agentId } = propsValue;

    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    const response = await httpClient.sendRequest<{
      success: boolean;
      data: AgentGetResponse;
    }>({
      url: `${baseUrlv0}/agent/${agentId}`,
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth as string,
      },
    });

    return response.body.data;
  },
});
