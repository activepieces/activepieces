import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { cancelPipeline } from '../../common/irreversible';
import { gitlabProps, requirePositiveInt } from '../../common/props';
import { pipelineOutputSchema } from '../../output-schemas-admin';

export const cancelPipelineAction = createAction({
  auth: gitlabAuth,
  name: 'cancel_pipeline',
  displayName: 'Cancel Pipeline',
  description: 'Cancels the running and pending jobs of a pipeline.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Cancels a running or pending GitLab pipeline; its unfinished jobs stop and cannot be resumed (Retry Pipeline starts the failed and canceled jobs again as new runs). Cancelling a finished pipeline changes nothing and returns it as is.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    pipelineId: adminProps.pipelineId(),
  },
  outputSchema: pipelineOutputSchema,
  async run({ auth, propsValue }) {
    const pipelineId = requirePositiveInt({ value: propsValue.pipelineId, label: 'Pipeline ID' });
    return cancelPipeline({ auth, projectId: propsValue.projectId, pipelineId });
  },
});
