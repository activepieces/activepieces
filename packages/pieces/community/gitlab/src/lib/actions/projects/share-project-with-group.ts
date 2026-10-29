import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps, optionalDay, requireAccessLevel } from '../../common/admin';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { projectShareOutputSchema } from '../../output-schemas-admin';

export const shareProjectWithGroupAction = createAction({
  auth: gitlabAuth,
  name: 'share_project_with_group',
  displayName: 'Share Project With Group',
  description: 'Gives every member of a group access to a project.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Shares a GitLab project with a group so its members get the chosen access level, optionally until an expiry date. Find candidate groups with List Project Share Locations. Sharing with a group that already has access fails with 409.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    groupId: Property.Number({ displayName: 'Group ID', description: 'Numeric ID of the group to share with.', required: true }),
    groupAccess: adminProps.accessLevel('Access Level', true, 'Role the group members get in the project.'),
    expiresAt: Property.ShortText({ displayName: 'Expires At', description: 'YYYY-MM-DD. Empty = no expiry.', required: false }),
  },
  outputSchema: projectShareOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabRequest({ auth, 
      method: 'POST',
      path: `${projectPath(propsValue.projectId)}/share`,
      body: {
        group_id: requirePositiveInt({ value: propsValue.groupId, label: 'Group ID' }),
        group_access: requireAccessLevel({ value: propsValue.groupAccess, label: 'Access Level' }),
        expires_at: optionalDay({ value: propsValue.expiresAt, label: 'Expires At' }),
      },
      statusMessages: { 409: 'The project is already shared with this group' },
    });
  },
});
