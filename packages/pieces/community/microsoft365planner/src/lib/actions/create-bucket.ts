import { createAction, Property } from '@activepieces/pieces-framework';
import { MicrosoftPlannerAuth } from '../common/auth';
import { Client } from '@microsoft/microsoft-graph-client';
import { planIdDropdown } from '../common/dropdown';

export const createBucket = createAction({
  auth: MicrosoftPlannerAuth,
  name: 'create_bucket',
  displayName: 'Create Bucket',
  description: 'Creates a new bucket under a specified planner plan',

  props: {
    planId: planIdDropdown,
    name: Property.ShortText({
      displayName: 'Bucket Name',
      description: 'Name/title for the new bucket',
      required: true,
    }),
    orderHint: Property.ShortText({
      displayName: 'Order Hint',
      description: 'Order hint for the bucket (optional). Leave empty to let Graph assign automatically.',
      required: false,
    }),
  },

  async run(context) {
    const { planId, name, orderHint } = context.propsValue;

    const payload: any = {
      planId,
      name,
    };
    if (orderHint) {
      payload.orderHint = orderHint;
    }
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(context.auth.access_token),
      },
    });
    const response = await client
      .api(`/planner/buckets`)
      .post(payload);

    return response;
  }
});
