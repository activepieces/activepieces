import { createAction, Property } from '@activepieces/pieces-framework';
import { productboardAuth, featureId } from '../auth';

export const getFeature = createAction({
  auth: productboardAuth,
  name: 'get_feature',
  displayName: 'Get Feature',
  description: 'Get an existing feature',
  props: {
    feature_id: featureId,
  },
  async run(context) {
    const response = await fetch(`https://api.productboard.com/v1/features/${context.propsValue.feature_id}`, {
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'Accept': 'application/json',
      },
    });

    return await response.json();
  },
});
