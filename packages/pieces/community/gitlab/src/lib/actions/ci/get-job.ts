import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { jobOutputSchema } from '../../output-schemas-admin';

export const getJobAction = createAction({
  auth: gitlabAuth,
  name: 'get_job',
  displayName: 'Get Job',
  description: 'Gets one CI/CD job with its status and timings.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns one GitLab CI/CD job by its numeric ID: name, stage, status, failure reason, timings, commit and pipeline. Use Get Job Log for its console output.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    jobId: adminProps.jobId(),
  },
  outputSchema: jobOutputSchema,
  async run({ auth, propsValue }) {
    const jobId = requirePositiveInt({ value: propsValue.jobId, label: 'Job ID' });
    return gitlabRequest({ auth,  method: 'GET', path: `${projectPath(propsValue.projectId)}/jobs/${jobId}` });
  },
});
