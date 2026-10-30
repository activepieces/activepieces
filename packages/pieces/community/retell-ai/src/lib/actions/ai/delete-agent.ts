import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, isRetellStatus, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellSchemas } from '../../common/schemas';
export const deleteAgentAction = createAction({
  auth: retellAiAuth,
  name: 'delete_agent',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Agent',
  description: 'Deletes a voice agent and all its versions.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a voice agent with all its versions; numbers bound to it stop answering with it. Cannot be undone. An agent that is already gone returns already_deleted=true.',
    idempotent: false,
  },
  props: {
    agent_id: retellAiProps.id({ displayName: 'Agent ID', description: 'Voice agent ID to delete.' }),
  },
  outputSchema: retellSchemas.deleted({ idKey: 'agent_id', idLabel: 'Agent ID' }),
  async run({ auth, propsValue }) {
    const agentId = retellInput.seg({ value: propsValue.agent_id, label: 'Agent ID' });
    try {
      await retellApiCall({ apiKey: apiKeyOf(auth), method: HttpMethod.DELETE, path: `/delete-agent/${agentId}` });
    } catch (error) {
      if (isRetellStatus({ error, statuses: [404] })) {
        return { agent_id: decodeURIComponent(agentId), deleted: false, already_deleted: true };
      }
      throw error;
    }
    return { agent_id: decodeURIComponent(agentId), deleted: true, already_deleted: false };
  },
});
