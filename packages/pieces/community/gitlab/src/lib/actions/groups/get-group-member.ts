import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps, groupPath } from '../../common/admin';
import { gitlabRequest } from '../../common/client';
import { requirePositiveInt } from '../../common/props';
import { memberOutputSchema } from '../../output-schemas-admin';

export const getGroupMemberAction = createAction({
  auth: gitlabAuth,
  name: 'get_group_member',
  displayName: 'Get Group Member',
  description: 'Gets the direct membership and access level of one user in a group.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns one user direct membership in a GitLab group with the access level (10 Guest, 20 Reporter, 30 Developer, 40 Maintainer, 50 Owner). Members inherited from a parent group are not found here; use List Group Members with Include Inherited for those.',
    idempotent: true,
  },
  props: {
    groupId: adminProps.groupId(),
    userId: adminProps.userId(),
  },
  outputSchema: memberOutputSchema,
  async run({ auth, propsValue }) {
    const userId = requirePositiveInt({ value: propsValue.userId, label: 'User ID' });
    return gitlabRequest({ auth, 
      method: 'GET',
      path: `${groupPath(propsValue.groupId)}/members/${userId}`,
      statusMessages: { 404: 'This user is not a direct member of the group (or the group was not found)' },
    });
  },
});
