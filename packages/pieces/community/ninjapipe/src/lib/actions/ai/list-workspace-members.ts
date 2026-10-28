import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../../auth';
import { ninjapipeClient } from '../../common/client';
import { ninjapipeRecords } from '../../common/records';
import { ninjapipeSchemas } from '../../output-schemas';

export const aiListWorkspaceMembers = createAction({
  auth: ninjapipeAuth,
  name: 'ai_list_workspace_members',
  classification: 'SEARCH',
  displayName: 'List Workspace Members',
  description: 'Lists the members of the NinjaPipe workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the people in the NinjaPipe workspace with account_id, email, full name and role. Use account_id as owner_id, assigned_to or assignee_id in other steps. Read-only.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.memberList,
  props: {},
  async run(context) {
    return ninjapipeRecords.listWorkspaceMembers({ auth: ninjapipeClient.readAuth(context.auth) });
  },
});
