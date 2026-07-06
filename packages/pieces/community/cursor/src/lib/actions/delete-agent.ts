import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cursorAuth } from '../common/auth';
import { makeCursorRequest } from '../common/client';
import { agentDropdown } from '../common/props';

export const deleteAgent = createAction({
  auth: cursorAuth,
  name: 'delete_agent',
  displayName: 'Delete Agent',
  description: 'Delete a cloud agent. This action is permanent and cannot be undone.',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently deletes a Cursor cloud agent by its agent id. Use to clean up or stop an agent run; this cannot be undone. The first call removes the agent and subsequent calls for the same id will not find it, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    agentId: agentDropdown,
  },
  async run(context) {
    const { agentId } = context.propsValue;

    return await makeCursorRequest(
      context.auth,
      `/v0/agents/${agentId}`,
      HttpMethod.DELETE
    );
  },
});

