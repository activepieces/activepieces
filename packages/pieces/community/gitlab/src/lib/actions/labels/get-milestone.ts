import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { milestoneOutputSchema } from '../../output-schemas-admin';

export const getMilestoneAction = createAction({
  auth: gitlabAuth,
  name: 'get_milestone',
  displayName: 'Get Milestone',
  description: 'Gets one project milestone by its ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns one GitLab project milestone by its global id (not the iid shown in the UI): title, description, state, start and due dates, expired flag and URL. Find the id with List Milestones.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    milestoneId: adminProps.milestoneId(),
  },
  outputSchema: milestoneOutputSchema,
  async run({ auth, propsValue }) {
    const milestoneId = requirePositiveInt({ value: propsValue.milestoneId, label: 'Milestone ID' });
    return gitlabRequest({ auth,  method: 'GET', path: `${projectPath(propsValue.projectId)}/milestones/${milestoneId}` });
  },
});
