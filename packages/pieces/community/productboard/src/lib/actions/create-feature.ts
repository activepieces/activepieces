import { createAction, Property } from '@activepieces/pieces-framework';
import { productboardAuth } from '../auth';

export const createFeature = createAction({
  auth: productboardAuth,
  name: 'create_feature',
  displayName: 'Create Feature',
  description: 'Create a new feature in Productboard',
  props: {
    name: Property.ShortText({
      displayName: 'Feature Name',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
  },
  async run(context) {
    const response = await fetch('https://api.productboard.com/v1/features', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          type: 'feature',
          attributes: {
            name: context.propsValue.name,
            description: context.propsValue.description,
          },
        },
      }),
    });

    return await response.json();
  },
});
