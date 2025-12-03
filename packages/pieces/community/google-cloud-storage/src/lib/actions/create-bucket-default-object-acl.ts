import { createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { gcsCommon } from '../common/client';
import { bucketDropdown, aclEntityProperty, objectAclRoleProperty, projectIdProperty } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const createBucketDefaultObjectAcl = createAction({
  auth: googleCloudStorageAuth,
  name: 'create_bucket_default_object_acl',
  displayName: 'Create Bucket Default Object ACL',
  description: 'Set default ACLs for new objects added to a bucket. Perfect for automatically assigning permissions to new uploads.',
  props: {
    projectId: projectIdProperty,
    bucket: bucketDropdown,
    entity: aclEntityProperty,
    role: objectAclRoleProperty,
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
        `/b/${bucket}/defaultObjectAcl`,
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
        throw new Error('Bad request. This bucket may have uniform bucket-level access enabled, which doesn\'t support default object ACLs. Use IAM policies instead.');
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied. You need storage.buckets.update permission to modify bucket default object ACLs.');
      }
      if (error.response?.status === 404) {
        throw new Error(`Bucket "${bucket}" not found.`);
      }
      if (error.response?.status === 409) {
        throw new Error(`Default object ACL entry for entity "${entity}" already exists on bucket "${bucket}".`);
      }
      throw new Error(`Failed to create bucket default object ACL: ${error.message || 'Unknown error'}`);
    }
  },
});