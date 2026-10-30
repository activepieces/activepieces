import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { deletedMilestoneOutputSchema } from '../../output-schemas-admin';

export const deleteMilestoneAction = createAction({
  auth: gitlabAuth,
  name: 'delete_milestone',
  displayName: 'Delete Milestone',
  description: 'Permanently deletes a project milestone.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes a GitLab project milestone by its global id and unsets it on every issue and merge request; it cannot be restored. Requires the Planner, Reporter or higher role. A second call fails with not found. Use Update Milestone to close it instead.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    milestoneId: adminProps.milestoneId(),
  },
  outputSchema: deletedMilestoneOutputSchema,
  async run({ auth, propsValue }) {
    const milestoneId = requirePositiveInt({ value: propsValue.milestoneId, label: 'Milestone ID' });
    await gitlabRequest({ auth,  method: 'DELETE', path: `${projectPath(propsValue.projectId)}/milestones/${milestoneId}` });
    return { deleted: true, milestoneId };
  },
});
