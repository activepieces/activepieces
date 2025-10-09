import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { MicrosoftPlannerAuth } from '../common/auth';

export const deleteBucket = createAction({
  auth:MicrosoftPlannerAuth,
  name: 'delete_bucket',
  displayName: 'Delete Planner Bucket',
  description: 'Deletes an existing Planner bucket by its ID.',

  props: {
    bucketId: Property.ShortText({
      displayName: 'Bucket ID',
      description: 'The ID of the bucket to delete.',
      required: true,
    }),
    etag: Property.ShortText({
      displayName: 'ETag',
      description: 'The ETag of the bucket (use GET /planner/buckets/{bucketId} to retrieve it).',
      required: true,
    }),
  },

  async run(context) {
    const accessToken = (context.auth as { access_token: string }).access_token;
    const { bucketId, etag } = context.propsValue;

    const response = await makeRequest(
      accessToken,
      HttpMethod.DELETE,
      `/planner/buckets/${bucketId}`,
      undefined,
      {
        'If-Match': etag,
      }
    );

    return {
      success: true,
      message: `Bucket with ID ${bucketId} deleted successfully.`,
      response,
    };
  },
});
