import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cursorAuth } from '../common/auth';
import { makeCursorRequest } from '../common/client';
import { agentDropdown } from '../common/props';

export const findAgentStatus = createAction({
  auth: cursorAuth,
  name: 'find_agent_status',
  displayName: 'Find Agent Status',
  description: 'Retrieve the current status and results of a cloud agent',
  props: {
    agentId: agentDropdown,
  },
  async run(context) {
    const { agentId } = context.propsValue;

    return await makeCursorRequest(
      context.auth,
      `/v0/agents/${agentId}`,
      HttpMethod.GET
    );
  },
});

