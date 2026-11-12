import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { projectDropdown, userDropdown, flattenObject } from '../common';
import { youtrackClient } from '../common/client';
import { addUserToTeamActionOutputSchema } from '../output-schemas';

export const addUserToTeamAction = createAction({
  auth: youtrackAuth,
  name: 'add_user_to_team',
  classification: 'WRITE',
  outputSchema: addUserToTeamActionOutputSchema,
  displayName: 'Add User to Project Team',
  description: 'Adds a user as a direct member of a project team, giving them access to the project.',
  audience: 'both',
  aiMetadata: {
    description:
      'Add a user as a direct member of a project team, granting them access to the project; requires the project ID (from List Projects) and the user ID (from Find Users). Idempotent: adding a user who is already a team member leaves membership unchanged.',
    idempotent: true,
  },
  props: { project: projectDropdown, user: userDropdown },
  async run(context) {
    const response = await youtrackClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/admin/projects/${youtrackClient.segment({ value: context.propsValue.project, label: 'Project' })}/team/ownUsers`,
      query: { fields: 'id,login,name' },
      body: { id: youtrackClient.optionalText(context.propsValue.user) },
      operation: 'add the user to the project team',
    });
    return flattenObject({ obj: youtrackClient.recordOf(response) });
  },
});
