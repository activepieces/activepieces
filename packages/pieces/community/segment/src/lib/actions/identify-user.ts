import { segmentAuth } from '../../.';
import { Property, createAction } from '@activepieces/pieces-framework';
import { Analytics } from '@segment/analytics-node'

export const identifyUser = createAction({
  name: 'identifyUser',
  displayName: 'Identify User',
  description: '',
  props: {
    userId: Property.ShortText({
      displayName: 'User ID',
      required: true,
    }),
    traits: Property.Object({
      displayName: 'Traits',
      description: 'The traits to associate with the user',
      required: true,
    }),
  },
  auth: segmentAuth,
  async run(context) {
    const analytics = new Analytics({ writeKey: context.auth })
    analytics.identify({
      userId: context.propsValue.userId,
      traits: context.propsValue.traits,
    })
    return {
      success: true,

    }
  },
});
