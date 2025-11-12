import { createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { gcsCommon } from '../common/client';
import { bucketDropdown, aclEntityProperty, bucketAclRoleProperty, projectIdProperty } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const createBucketAcl = createAction({
  auth: googleCloudStorageAuth,
  name: 'create_bucket_acl',
  displayName: 'Create Bucket ACL',
  description: 'Add an ACL entry at bucket level. Perfect for granting permission to manage the bucket.',
  props: {
    projectId: projectIdProperty,
    bucket: bucketDropdown,
    entity: aclEntityProperty,
    role: bucketAclRoleProperty,
  },
  async run(context) {
    const { bucket, entity, role } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    const aclEntry = {
      entity,
      role,
    };

    try {
      const response = await gcsCommon.makeRequest(
        HttpMethod.POST,
        `/b/${bucket}/acl`,
        auth.access_token,
        aclEntry
      );

      return {
        success: true,
        bucket,
        acl: response,
      };
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error('Bad request. This bucket may have uniform bucket-level access enabled, which doesn\'t support bucket ACLs. Use IAM policies instead.');
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied. You need storage.buckets.update permission to modify bucket ACLs.');
      }
      if (error.response?.status === 404) {
        throw new Error(`Bucket "${bucket}" not found.`);
      }
      if (error.response?.status === 409) {
        throw new Error(`ACL entry for entity "${entity}" already exists on bucket "${bucket}".`);
      }
      throw new Error(`Failed to create bucket ACL: ${error.message || 'Unknown error'}`);
    }
  },
});