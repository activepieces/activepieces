import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getAiAgentAction = createAction({
  auth: boxAuth,
  name: 'box_get_ai_agent',
  displayName: 'Get AI Agent',
  description: 'Gets a Box AI Studio agent by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one Box AI Studio agent with its name, access state, allowed users and groups, and ask, text_gen and extract configs. Needs AI Studio and an admin. Get the agent ID from List AI Agents or Create AI Agent.',
    idempotent: true,
  },
  props: {
    agentId: boxAiProps.aiAgentId({
      required: true,
      description: 'The AI agent ID, from List AI Agents or Create AI Agent.',
    }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/ai_agents/${encodeURIComponent(propsValue.agentId)}`,
      query: { fields: propsValue.fields },
    });
  },
});
