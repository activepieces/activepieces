import { createAction, Property } from '@activepieces/pieces-framework';
import { MicrosoftPlannerAuth } from '../common/auth';
import { Client } from '@microsoft/microsoft-graph-client';

export const getPlannerBucket = createAction({
  auth: MicrosoftPlannerAuth,
  name: 'get_planner_bucket',
  displayName: 'Get Planner Bucket',
  description: 'Retrieve details about a specific Planner bucket by its ID.',

  props: {
    bucketId: Property.ShortText({
      displayName: 'Bucket ID',
      description: 'The ID of the bucket to retrieve.',
      required: true,
    }),
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
