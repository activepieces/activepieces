import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { cancelJob } from '../../common/irreversible';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { jobOutputSchema } from '../../output-schemas-admin';

export const cancelJobAction = createAction({
  auth: gitlabAuth,
  name: 'cancel_job',
  displayName: 'Cancel Job',
  description: 'Cancels a running or pending CI/CD job.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Cancels one running or pending GitLab CI/CD job; it stops and cannot be resumed (a retry is a new job run). Cancelling a finished job changes nothing. Use Cancel Pipeline to stop every job of a pipeline.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    jobId: adminProps.jobId(),
  },
  outputSchema: jobOutputSchema,
  async run({ auth, propsValue }) {
    const jobId = requirePositiveInt({ value: propsValue.jobId, label: 'Job ID' });
    return cancelJob({ auth, projectId: propsValue.projectId, jobId });
  },
});
