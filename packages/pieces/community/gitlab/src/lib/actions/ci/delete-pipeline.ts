import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { deletedPipelineOutputSchema } from '../../output-schemas-admin';

export const deletePipelineAction = createAction({
  auth: gitlabAuth,
  name: 'delete_pipeline',
  displayName: 'Delete Pipeline',
  description: 'Permanently deletes a pipeline with its jobs, logs and artifacts.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes a GitLab pipeline together with its jobs, job logs and artifacts; it cannot be restored. Requires the Owner role. A second call fails with not found. Use Cancel Pipeline to only stop it.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    pipelineId: adminProps.pipelineId(),
  },
  outputSchema: deletedPipelineOutputSchema,
  async run({ auth, propsValue }) {
    const pipelineId = requirePositiveInt({ value: propsValue.pipelineId, label: 'Pipeline ID' });
    await gitlabRequest({ auth,  method: 'DELETE', path: `${projectPath(propsValue.projectId)}/pipelines/${pipelineId}` });
    return { deleted: true, pipelineId };
  },
});
