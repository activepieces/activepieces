import { straicoAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { baseUrlv0 } from '../common/common';
import { agentIdDropdown } from '../common/props';

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
  audience: 'both',
  auth: straicoAuth,
  name: 'agent_get',
  displayName: 'Get Agent Details',
  description: 'Retrieve details of a specific agent',
  aiMetadata: { description: 'Fetches the full configuration of one Straico agent by id, including its custom prompt, default LLM, status, visibility and any attached RAG base. Use it to inspect or verify a single agent before prompting or updating it; prefer List Agents when the id is not known yet or when several agents must be compared. Requires the agent id. Read-only and idempotent.', idempotent: true },
  props: {
    agentId:agentIdDropdown('Agent','Select the agent to get details for.')
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
        token: auth.secret_text,
      },
    });

    return response.body.data;
  },
});
