import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, getAuth } from '../common';

export const deletePipeline = createAction({
  auth: ninjapipeAuth,
  name: 'delete_pipeline',
  displayName: 'Delete Pipeline',
  description: 'Deletes a pipeline by ID.',
  props: {
    pipelineId: Property.ShortText({ displayName: 'Pipeline ID', required: true }),
  },
  async run(context) {
    const auth = getAuth(context);
    await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.DELETE, path: `/pipelines/${context.propsValue.pipelineId}` });
    return { success: true, deleted_id: context.propsValue.pipelineId };
  },
});
