import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { MicrosoftPlannerAuth } from '../common/auth';

export const updateBucket = createAction({
  auth:MicrosoftPlannerAuth,
  name: 'update_bucket',
  displayName: 'Update Planner Bucket',
  description: 'Modify the name or orderHint of an existing Planner bucket.',

  props: {
    bucketId: Property.ShortText({
      displayName: 'Bucket ID',
      description: 'The ID of the bucket you want to update.',
      required: true,
    }),
    etag: Property.ShortText({
      displayName: 'ETag',
      description:
        'The ETag value of the bucket. Required for concurrency. Retrieve it via GET /planner/buckets/{bucketId}.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Bucket Name',
      description: 'New name for the bucket (optional).',
      required: false,
    }),
    orderHint: Property.ShortText({
      displayName: 'Order Hint',
      description: 'Hint used to order buckets in the plan (optional). Example: !ABC123.',
      required: false,
    }),
  },

  async run(context) {
    const accessToken = (context.auth as { access_token: string }).access_token;
    const { bucketId, etag, name, orderHint } = context.propsValue;

    const payload: Record<string, any> = {};
    if (name) payload['name'] = name;
    if (orderHint) payload['orderHint'] = orderHint;

    const response = await makeRequest(
      accessToken,
      HttpMethod.PATCH,
      `/planner/buckets/${bucketId}`,
      payload,
      {
        'If-Match': etag,
      }
    );

    return {
      success: true,
      message: `Bucket with ID ${bucketId} updated successfully.`,
      response,
    };
  },
});
