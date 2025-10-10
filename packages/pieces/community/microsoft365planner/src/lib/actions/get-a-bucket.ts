import { createAction, Property } from '@activepieces/pieces-framework';
import { MicrosoftPlannerAuth } from '../common/auth';
import { Client } from '@microsoft/microsoft-graph-client';
import { bucketIdDropdown, planIdDropdown } from '../common/dropdown';

export const getPlannerBucket = createAction({
  auth: MicrosoftPlannerAuth,
  name: 'get_planner_bucket',
  displayName: 'Get Planner Bucket',
  description: 'Retrieve details about a specific Planner bucket by its ID.',

  props: {
    planId: planIdDropdown,
    bucketId: bucketIdDropdown,
  },

  async run(context) {

    const { bucketId } = context.propsValue;
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () =>
          Promise.resolve((context.auth as { access_token: string }).access_token),
      },
    });
    const response = await client
      .api(`/planner/buckets/${bucketId}`)
      .get();

    return response;
  },
});
