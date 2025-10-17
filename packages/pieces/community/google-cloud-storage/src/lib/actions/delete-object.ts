import { createAction } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { googleCloudStorageProps } from '../common/props';
import { GoogleCloudStorageClient } from '../common/client';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const deleteObject = createAction({
  auth: googleCloudStorageAuth,
  name: 'delete_object',
  displayName: 'Delete Object',
  description: 'Permanently delete a specific object.',
  props: {
    project: googleCloudStorageProps.project(),
    bucket: googleCloudStorageProps.bucket(),
    object: googleCloudStorageProps.object(),
  },
  async run({ auth, propsValue }) {
    const client = new GoogleCloudStorageClient(
      (auth as OAuth2PropertyValue).access_token
    );

    await client.deleteObject(propsValue.bucket, propsValue.object);

    return {
      success: true,
      message: `Object "${propsValue.object}" in bucket "${propsValue.bucket}" was deleted successfully.`,
    };
  },
});