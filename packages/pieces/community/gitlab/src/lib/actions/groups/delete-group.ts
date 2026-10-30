import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps, groupPath } from '../../common/admin';
import { gitlabRequest } from '../../common/client';
import { requireText } from '../../common/props';
import { vendorMessage } from '../../common/secret-request';
import { deletedGroupOutputSchema } from '../../output-schemas-admin';

export const deleteGroupAction = createAction({
  auth: gitlabAuth,
  name: 'delete_group',
  displayName: 'Delete Group',
  description: 'Deletes a group with its subgroups and projects. On gitlab.com it is marked for deletion and removed after the retention period.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Deletes a GitLab group together with all its subgroups and projects. On gitlab.com the group is first marked for deletion and removed after the retention period (an Owner can restore it in the UI until then). Requires the Owner role.',
    idempotent: false,
  },
  props: {
    groupId: adminProps.groupId(),
  },
  outputSchema: deletedGroupOutputSchema,
  async run({ auth, propsValue }) {
    const groupId = requireText({ value: propsValue.groupId, label: 'Group ID or path' });
    const body = await gitlabRequest<unknown>({ auth,  method: 'DELETE', path: groupPath(groupId) });
    return { deletionRequested: true, groupId, message: vendorMessage(body) ?? null };
  },
});
