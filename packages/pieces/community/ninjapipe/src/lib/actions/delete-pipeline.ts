import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, getAuth, ninjapipeCommon } from '../common';

export const deletePipeline = createAction({
  auth: ninjapipeAuth,
  name: 'delete_pipeline',
  displayName: 'Delete Pipeline',
  description: 'Deletes a pipeline by ID.',
  props: {
    pipelineId: ninjapipeCommon.pipelineDropdownRequired,
  },
  async run(context) {
    const auth = getAuth(context);
    await ninjapipeApiCall<Record<string, unknown>>({ auth, method: HttpMethod.DELETE, path: `/pipelines/${encodeURIComponent(String(context.propsValue.pipelineId))}` });
    return { success: true, deleted_id: context.propsValue.pipelineId };
  },
});
