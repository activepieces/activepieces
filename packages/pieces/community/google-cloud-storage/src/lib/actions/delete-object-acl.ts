import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { gcsCommon } from '../common/client';
import { bucketDropdown, objectDropdown, aclEntityProperty, projectIdProperty } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteObjectAcl = createAction({
  auth: googleCloudStorageAuth,
  name: 'delete_object_acl',
  displayName: 'Delete Object ACL',
  description: 'Remove an ACL entry from an object. Perfect for revoking access for a user.',
  props: {
    projectId: projectIdProperty,
    bucket: bucketDropdown,
    object: objectDropdown('bucket'),
    entity: aclEntityProperty,
    generation: Property.Number({
      displayName: 'Generation',
      description: 'Optional generation number for versioned objects',
      required: false,
    }),
  },
  async run(context) {
    const { bucket, object, entity, generation } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    let path = `/b/${bucket}/o/${encodeURIComponent(object as string)}/acl/${encodeURIComponent(entity as string)}`;
    if (generation) {
      path += `?generation=${generation}`;
    }

    try {
      await gcsCommon.makeRequest(HttpMethod.DELETE, path, auth.access_token);

      return {
        success: true,
        bucket,
        object,
        entity,
        generation: generation || 'latest',
        message: `ACL entry for entity "${entity}" removed successfully from object "${object}"`,
      };
    } catch (error: any) {
      if (error.response?.status === 400) {
        if (entity.includes('user-') && entity.includes('@')) {
          throw new Error('Cannot remove OWNER access from the object owner. The only way to remove owner access is to delete or replace the object.');
        }
        throw new Error('Bad request. This bucket may have uniform bucket-level access enabled, which doesn\'t support object ACLs. Use IAM policies instead.');
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied. You need storage.objects.setIamPolicy permission or OWNER ACL permission on the object.');
      }
      if (error.response?.status === 404) {
        if (error.response?.data?.error?.message?.includes('ACL')) {
          throw new Error(`ACL entry for entity "${entity}" not found on object "${object}".`);
        }
        throw new Error(`Object "${object}" not found in bucket "${bucket}".`);
      }
      throw new Error(`Failed to delete object ACL: ${error.message || 'Unknown error'}`);
    }
  },
});