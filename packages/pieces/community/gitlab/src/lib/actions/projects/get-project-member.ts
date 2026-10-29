import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { memberOutputSchema } from '../../output-schemas-admin';

export const getProjectMemberAction = createAction({
  auth: gitlabAuth,
  name: 'get_project_member',
  displayName: 'Get Project Member',
  description: 'Gets the membership and access level of one user in a project.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns one user membership in a GitLab project with the access level. By default only direct members are found; set Include Inherited to also find members who get access through a parent or shared group. Not found means the user is not a member.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    userId: adminProps.userId(),
    includeInherited: gitlabProps.triState('Include Inherited', 'Also match members inherited from groups.'),
  },
  outputSchema: memberOutputSchema,
  async run({ auth, propsValue }) {
    const userId = requirePositiveInt({ value: propsValue.userId, label: 'User ID' });
    const scope = propsValue.includeInherited === 'true' ? 'members/all' : 'members';
    return gitlabRequest({ auth, 
      method: 'GET',
      path: `${projectPath(propsValue.projectId)}/${scope}/${userId}`,
      statusMessages: { 404: 'This user is not a member of the project (or the project was not found)' },
    });
  },
});
