import { createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { gcsCommon } from '../common/client';
import { bucketDropdown, projectIdProperty } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteEmptyBucket = createAction({
  auth: googleCloudStorageAuth,
  name: 'delete_empty_bucket',
  displayName: 'Delete Empty Bucket',
  description: 'Clean up unused buckets by deleting them if they contain no live objects.',
  props: {
    projectId: projectIdProperty,
    bucket: bucketDropdown,
  },
  async run(context) {
    const { bucket } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    try {
      await gcsCommon.makeRequest(HttpMethod.DELETE, `/b/${bucket}`, auth.access_token);

      return {
        success: true,
        message: `Bucket "${bucket}" deleted successfully`,
      };
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error(`Bucket "${bucket}" contains live or noncurrent objects and cannot be deleted. Remove all objects first.`);
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied. You need storage.buckets.delete permission to delete this bucket.');
      }
      if (error.response?.status === 404) {
        throw new Error(`Bucket "${bucket}" not found. It may have already been deleted.`);
      }
      throw new Error(`Failed to delete bucket: ${error.message || 'Unknown error'}`);
    }
  },
});