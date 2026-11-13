import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { eraseJob } from '../../common/irreversible';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { jobOutputSchema } from '../../output-schemas-admin';

export const eraseJobAction = createAction({
  auth: gitlabAuth,
  name: 'erase_job',
  displayName: 'Erase Job',
  description: 'Permanently erases the log and artifacts of a finished job.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently erases the console log and artifacts of a finished GitLab CI/CD job; they cannot be restored. The job record stays with erased_at set. Fails on a running job, and a second call on the same job fails.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    jobId: adminProps.jobId(),
  },
  outputSchema: jobOutputSchema,
  async run({ auth, propsValue }) {
    const jobId = requirePositiveInt({ value: propsValue.jobId, label: 'Job ID' });
    return eraseJob({ auth, projectId: propsValue.projectId, jobId });
  },
});
