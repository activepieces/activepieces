import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { pipelineOutputSchema } from '../../output-schemas-admin';

export const retryPipelineAction = createAction({
  auth: gitlabAuth,
  name: 'retry_pipeline',
  displayName: 'Retry Pipeline',
  description: 'Retries the failed and canceled jobs of a pipeline.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Retries the failed or canceled jobs of a GitLab pipeline as new job runs in the same pipeline. Each call queues new job runs, so do not repeat it while the pipeline is still running. Use Run Pipeline to start a fresh pipeline instead.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    pipelineId: adminProps.pipelineId(),
  },
  outputSchema: pipelineOutputSchema,
  async run({ auth, propsValue }) {
    const pipelineId = requirePositiveInt({ value: propsValue.pipelineId, label: 'Pipeline ID' });
    return gitlabRequest({ auth,  method: 'POST', path: `${projectPath(propsValue.projectId)}/pipelines/${pipelineId}/retry` });
  },
});
