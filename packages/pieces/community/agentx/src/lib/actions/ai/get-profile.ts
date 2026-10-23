import { createAction } from '@activepieces/pieces-framework';

import { agentxAuth } from '../../auth';
import { agentxApi } from '../../common/api';

export const getProfileAction = createAction({
  auth: agentxAuth,
  name: 'agentx_get_profile',
  displayName: 'Get Profile',
  description: 'Gets the profile of the AgentX user that owns the API key.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the profile of the AgentX user that owns the connected API key. Use it to confirm which account the agent is acting on.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await agentxApi.getProfile({ auth });
  },
});
