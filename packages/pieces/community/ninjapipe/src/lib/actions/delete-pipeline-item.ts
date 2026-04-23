import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, getAuth } from '../common';

export const deletePipelineItem = createAction({
  auth: ninjapipeAuth,
  name: 'delete_pipeline_item',
  displayName: 'Delete Pipeline Item',
  description: 'Deletes a pipeline item by ID.',
  props: {
    itemId: Property.ShortText({ displayName: 'Item ID', required: true }),
  },
  async run(context) {
    const auth = getAuth(context);
    await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.DELETE, path: `/pipeline_items/${context.propsValue.itemId}` });
    return { success: true, deleted_id: context.propsValue.itemId };
  },
});
