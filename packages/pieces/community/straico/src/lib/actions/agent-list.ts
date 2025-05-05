import { straicoAuth } from '../../index';
import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { baseUrlv0 } from '../common/common';

interface Agent {
  _id: string;
  uuid4: string;
  user_id: string;
  default_llm: string;
  custom_prompt: string;
  name: string;
  description: string;
  status: string;
  tags: string[];
  __v: number;
  rag_association?: string;
}

interface AgentListResponse {
  success: boolean;
  data: Agent[];
}

export const agentList = createAction({
  auth: straicoAuth,
  name: 'agent-list',
  displayName: 'List Agents',
  description: 'Retrieves the list of agents created by and available to the user.',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest<AgentListResponse>({
      url: `${baseUrlv0}/agent`,
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth as string,
      },
    });

    return response.body.data;
  },
});
