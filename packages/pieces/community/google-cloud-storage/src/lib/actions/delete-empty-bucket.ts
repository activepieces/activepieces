import { createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { gcsCommon } from '../common/client';
import { bucketDropdown, projectIdProperty } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteEmptyBucket = createAction({
  auth: googleCloudStorageAuth,
  name: 'delete_empty_bucket',
  displayName: 'Delete Empty Bucket',
  description: 'Delete a Google Cloud Storage bucket if it is empty',
  props: {
    projectId: projectIdProperty,
    bucket: bucketDropdown,
  },
  async run(context) {
    const { bucket } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    const objectsResponse = await gcsCommon.makeRequest(HttpMethod.GET, `/b/${bucket}/o?maxResults=1`, auth.access_token);
    
    if (objectsResponse.items && objectsResponse.items.length > 0) {
      throw new Error('BUCKET_NOT_EMPTY: Cannot delete bucket that contains objects');
    }

    await gcsCommon.makeRequest(HttpMethod.DELETE, `/b/${bucket}`, auth.access_token);
    
    return {
      success: true,
      message: `Bucket ${bucket} deleted successfully`,
    };
  },
});