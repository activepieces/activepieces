import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { MicrosoftPlannerAuth } from '../common/auth';

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
    const accessToken = (context.auth as { access_token: string }).access_token;
    const { bucketId } = context.propsValue;

    const url = `/planner/buckets/${bucketId}`;

      const response = await makeRequest(accessToken, HttpMethod.GET, url);

      return {
        success: true,
        message: `Bucket with ID ${bucketId} retrieved successfully.`,
        bucket: response,
      };
    
  },
});
