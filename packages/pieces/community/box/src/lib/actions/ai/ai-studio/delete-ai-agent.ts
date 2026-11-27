import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const deleteAiAgentAction = createAction({
  auth: boxAuth,
  name: 'box_delete_ai_agent',
  displayName: 'Delete AI Agent',
  description: 'Permanently deletes a Box AI Studio agent.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a Box AI Studio agent; it cannot be restored. To only turn it off, use Update AI Agent with Access State "disabled". Needs AI Studio and an admin. Get the agent ID from List AI Agents.',
    idempotent: false,
  },
  props: {
    agentId: boxAiProps.aiAgentId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/ai_agents/${encodeURIComponent(propsValue.agentId)}`,
    });
    return { deleted: true, agentId: propsValue.agentId };
  },
});
