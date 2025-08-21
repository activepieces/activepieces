import { createAction } from '@activepieces/pieces-framework';
import { retellAiAuth, retellAiApi, retellAiCommon } from '../common';

export const getAgent = createAction({
  auth: retellAiAuth,
  name: 'get_agent',
  displayName: 'Get an Agent',
  description: 'Fetch details of a Retell AI agent by Agent ID',
  props: {
    agent_id: retellAiCommon.agent_id,
  },
  async run(context) {
    const { agent_id } = context.propsValue;

    const response = await retellAiApi.get(`/v2/get-agent`, context.auth, { agent_id });
    return response;
  },
});
