import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const deletePipeline = createAction({
  auth: ninjapipeAuth,
  name: 'delete_pipeline',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Pipeline',
  description: 'Permanently deletes a pipeline. Its items are removed with it.',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently delete one NinjaPipe pipeline by ID (pipelineId; get it from a list or search step). Cannot be undone. A second call fails with 404 because the pipeline is gone.',
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.deleted,
  props: {
    pipelineId: ninjapipeProps.pipelineRequired(),
  },
  async run(context) {
    const id = ninjapipeClient.pathId({ value: context.propsValue.pipelineId, field: 'Pipeline' });
    return ninjapipeClient.deleteRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      path: `/pipelines/${id}`,
      id: decodeURIComponent(id),
      operation: 'delete pipeline',
    });
  },
});
