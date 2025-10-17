import { createAction, Property } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { googleCloudStorageProps } from '../common/props';
import { GoogleCloudStorageClient } from '../common/client';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const searchBucket = createAction({
  auth: googleCloudStorageAuth,
  name: 'search_bucket',
  displayName: 'Search Bucket',
  description: 'Search for a bucket by its exact name within a project.',
  props: {
    project: googleCloudStorageProps.project(),
    bucket_name: Property.ShortText({
        displayName: 'Bucket Name',
        description: 'The exact name of the bucket to find.',
        required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new GoogleCloudStorageClient(
      (auth as OAuth2PropertyValue).access_token
    );

    const allBuckets = await client.listBuckets(propsValue.project);

    const foundBucket = allBuckets.items?.find(
        (bucket) => bucket.name === propsValue.bucket_name
    );


    return foundBucket ?? {};
  },
});