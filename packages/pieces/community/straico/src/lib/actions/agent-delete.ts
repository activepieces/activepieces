import { straicoAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { baseUrlv0 } from '../common/common';
import { agentIdDropdown } from '../common/props';

export const agentDelete = createAction({
  audience: 'both',
  auth: straicoAuth,
  name: 'agent_delete',
  displayName: 'Delete Agent',
  description: 'Delete a specific agent by its ID',
  aiMetadata: { description: 'Permanently removes a saved Straico agent (the stored persona made of a custom prompt, default LLM and any attached RAG base) from the account. Use only when the agent itself should stop existing; to pause it instead, prefer Update Agent with status set to inactive, and to detach knowledge without deleting, keep the agent and update it. Requires the agent id, which List Agents provides. Idempotent: the agent ends up gone no matter how many times it is called.', idempotent: true },
  props: {
    agentId: agentIdDropdown('Agent','Select the agent to delete')
  },
  async run({ auth, propsValue }) {
    const { agentId } = propsValue;

    if (!agentId) {
      throw new Error('Agent ID is required');
    }

    const response = await httpClient.sendRequest<{
      success: boolean;
      message: string;
    }>({
      url: `${baseUrlv0}/agent/${agentId}`,
      method: HttpMethod.DELETE,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
    });

    return response.body;
  },
});
