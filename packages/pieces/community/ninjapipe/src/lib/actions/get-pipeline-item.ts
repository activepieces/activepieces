import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth } from '../common';

export const getPipelineItem = createAction({
  auth: ninjapipeAuth,
  name: 'get_pipeline_item',
  displayName: 'Get Pipeline Item',
  description: 'Retrieves a pipeline item by ID.',
  props: {
    itemId: Property.ShortText({ displayName: 'Item ID', required: true }),
  },
  async run(context) {
    const auth = getAuth(context);
    const response = await ninjapipeApiCall<Record<string, any>>({ auth, method: HttpMethod.GET, path: `/pipeline_items/${context.propsValue.itemId}` });
    return flattenCustomFields(response.body);
  },
});
