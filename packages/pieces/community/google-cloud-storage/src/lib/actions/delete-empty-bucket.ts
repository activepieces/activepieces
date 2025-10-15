import { createAction } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { googleCloudStorageProps } from '../common/props';
import { GoogleCloudStorageClient } from '../common/client';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const deleteEmptyBucket = createAction({
  auth: googleCloudStorageAuth,
  name: 'delete_empty_bucket',
  displayName: 'Delete Empty Bucket',
  description: 'Delete a bucket that contains no objects.',
  props: {
    project: googleCloudStorageProps.project(),
    bucket: googleCloudStorageProps.bucket(),
  },
  async run({ auth, propsValue }) {
    const client = new GoogleCloudStorageClient(
      (auth as OAuth2PropertyValue).access_token
    );

    await client.deleteEmptyBucket(propsValue.bucket);

    return {
      success: true,
      message: `Bucket "${propsValue.bucket}" was deleted successfully.`,
    };
  },
});