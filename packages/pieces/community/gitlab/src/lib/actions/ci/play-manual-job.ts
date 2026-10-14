import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { jobOutputSchema } from '../../output-schemas-admin';
import { pipelineVariables } from './create-pipeline';

export const playManualJobAction = createAction({
  auth: gitlabAuth,
  name: 'play_manual_job',
  displayName: 'Play Manual Job',
  description: 'Starts a manual CI/CD job.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Starts a GitLab CI/CD job that waits for a manual action (status manual), e.g. a deploy step, optionally with job variables. Only works on manual jobs; a job that already ran fails with a 400 or 403. Find manual jobs with List Pipeline Jobs filtered to manual.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    jobId: adminProps.jobId(),
    variables: Property.Object({ displayName: 'Job Variables', description: 'Variables as name to value for this run.', required: false }),
  },
  outputSchema: jobOutputSchema,
  async run({ auth, propsValue }) {
    const jobId = requirePositiveInt({ value: propsValue.jobId, label: 'Job ID' });
    const variables = pipelineVariables(propsValue.variables)?.map(({ key, value }) => ({ key, value }));
    return gitlabRequest({ auth, 
      method: 'POST',
      path: `${projectPath(propsValue.projectId)}/jobs/${jobId}/play`,
      body: variables ? { job_variables_attributes: variables } : undefined,
      statusMessages: {
        400: 'GitLab could not start the job (only jobs waiting for a manual action can be played)',
        403: 'The job is not a manual job waiting to run, or the connected user may not run it',
      },
    });
  },
});
