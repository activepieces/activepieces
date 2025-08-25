import { createAction } from '@activepieces/pieces-framework';
import { retellAiAuth, retellCommon } from '../common';

export const getAgent = createAction({
  auth: retellAiAuth,
  name: 'getAgent',
  displayName: 'Get an Agent',
  description: 'Fetch details of a Retell AI agent by Agent ID.',
  props: retellCommon.getAgentProperties(),
  async run({ auth: apiKey, propsValue: { agentId, agentVersion } }) {
    return retellCommon.getAgent({ apiKey, agentId, agentVersion });
  },
});
