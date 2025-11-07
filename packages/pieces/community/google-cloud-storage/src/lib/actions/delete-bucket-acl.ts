import { createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { gcsCommon } from '../common/client';
import { bucketDropdown, aclEntityProperty, projectIdProperty } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteBucketAcl = createAction({
  auth: googleCloudStorageAuth,
  name: 'delete_bucket_acl',
  displayName: 'Delete Bucket ACL',
  description: 'Remove an ACL entry from a bucket. Perfect for revoking access for a user or group.',
  props: {
    projectId: projectIdProperty,
    bucket: bucketDropdown,
    entity: aclEntityProperty,
  },
  async run(context) {
    const { bucket, entity } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    try {
      await gcsCommon.makeRequest(
        HttpMethod.DELETE,
        `/b/${bucket}/acl/${encodeURIComponent(entity)}`,
        auth.access_token
      );

      return {
        success: true,
        bucket,
        entity,
        message: `ACL entry for entity "${entity}" removed successfully from bucket "${bucket}"`,
      };
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error('Bad request. This bucket may have uniform bucket-level access enabled, which doesn\'t support bucket ACLs. Use IAM policies instead.');
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied. You need storage.buckets.update permission to modify bucket ACLs.');
      }
      if (error.response?.status === 404) {
        if (error.response?.data?.error?.message?.includes('ACL')) {
          throw new Error(`ACL entry for entity "${entity}" not found on bucket "${bucket}".`);
        }
        throw new Error(`Bucket "${bucket}" not found.`);
      }
      throw new Error(`Failed to delete bucket ACL: ${error.message || 'Unknown error'}`);
    }
  },
});