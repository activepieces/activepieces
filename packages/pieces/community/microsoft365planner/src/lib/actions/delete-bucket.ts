import { createAction, Property } from '@activepieces/pieces-framework';
import { MicrosoftPlannerAuth } from '../common/auth';
import { Client } from '@microsoft/microsoft-graph-client';
import { bucketIdDropdown, planIdDropdown } from '../common/dropdown';

export const deleteBucket = createAction({
  auth: MicrosoftPlannerAuth,
  name: 'delete_bucket',
  displayName: 'Delete Bucket',
  description: 'Deletes an existing Planner bucket by its ID.',

  props: {
    planId:planIdDropdown,
    bucketId: bucketIdDropdown,
    etag: Property.ShortText({
      displayName: 'ETag',
      description:
        'The ETag of the bucket (use GET /planner/buckets/{bucketId} to retrieve it). Required for concurrency.',
      required: true,
    }),
  },

  async run(context) {
    const { bucketId, etag } = context.propsValue;

    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () =>
          Promise.resolve((context.auth as { access_token: string }).access_token),
      },
    });

    const response = await client
      .api(`/planner/buckets/${bucketId}`)
      .header('If-Match', etag)
      .delete();

    return response;

  },
});
