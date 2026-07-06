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
  audience: 'both',
  aiMetadata: {
    description: 'Retrieves the current status, summary, and result details of a single Cursor cloud agent by its agent id. Use to poll or check whether an agent is still running, finished, or failed. Read-only and idempotent.',
    idempotent: true,
  },
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

