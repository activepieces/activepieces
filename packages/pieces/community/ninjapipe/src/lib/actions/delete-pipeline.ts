import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, getAuth, ninjapipeCommon } from '../common';

export const deletePipeline = createAction({
  auth: ninjapipeAuth,
  name: 'delete_pipeline',
  displayName: 'Delete Pipeline',
  description: 'Deletes a pipeline by ID.',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete a NinjaPipe pipeline by its ID. Pick this only when the pipeline should be removed entirely; deletion is irreversible and cascades to the pipeline\'s stages. Safe to retry — deleting an already-deleted pipeline settles to the same removed state.', idempotent: true },
  props: {
    pipelineId: ninjapipeCommon.pipelineDropdownRequired,
  },
  async run(context) {
    const auth = getAuth(context);
    await ninjapipeApiCall<Record<string, unknown>>({ auth, method: HttpMethod.DELETE, path: `/pipelines/${encodeURIComponent(String(context.propsValue.pipelineId))}` });
    return { success: true, deleted_id: context.propsValue.pipelineId };
  },
});
