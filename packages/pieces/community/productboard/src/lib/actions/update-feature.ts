import { createAction, Property } from '@activepieces/pieces-framework';
import { productboardAuth, featureId } from '../auth';

export const updateFeature = createAction({
  auth: productboardAuth,
  name: 'update_feature',
  displayName: 'Update Feature',
  description: 'Update an existing feature',
  props: {
    feature_id: featureId,
    name: Property.ShortText({
      displayName: 'New Name',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'New Description',
      required: false,
    }),
  },
  async run(context) {
    const response = await fetch(`https://api.productboard.com/v1/features/${context.propsValue.feature_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          type: 'feature',
          id: context.propsValue.feature_id,
          attributes: {
            ...(context.propsValue.name && { name: context.propsValue.name }),
            ...(context.propsValue.description && { description: context.propsValue.description }),
          },
        },
      }),
    });

    return await response.json();
  },
});
