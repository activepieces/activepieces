import { straicoAuth } from '../auth';
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
  audience: 'both',
  auth: straicoAuth,
  name: 'agent-list',
  displayName: 'List Agents',
  description: 'Retrieves the list of agents created by and available to the user.',
  aiMetadata: { description: 'Returns every Straico agent available to the authenticated account with its id, name, default LLM, status, tags and RAG association. Use it as the id-discovery step before Get Agent Details, Update Agent, Delete Agent, Add RAG to Agent or Agent Prompt Completion; prefer Get Agent Details when the id is already known. Takes no inputs and cannot be filtered or searched server-side. Read-only and idempotent.', idempotent: true },
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest<AgentListResponse>({
      url: `${baseUrlv0}/agent`,
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
    });

    return response.body.data;
  },
});
