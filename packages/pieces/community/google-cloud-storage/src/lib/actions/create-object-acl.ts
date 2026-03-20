import {
  createAction,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { gcsCommon } from '../common/client';
import {
  bucketDropdown,
  objectDropdown,
  aclEntityProperty,
  objectAclRoleProperty,
  projectIdProperty,
} from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const createObjectAcl = createAction({
  auth: googleCloudStorageAuth,
  name: 'create_object_acl',
  displayName: 'Create Object ACL',
  description: 'Add an ACL entry to an object (grant a permission). Perfect for granting read/write access to a user or group.',
  props: {
    projectId: projectIdProperty,
    bucket: bucketDropdown,
    object: objectDropdown('bucket'),
    entity: aclEntityProperty,
    role: objectAclRoleProperty,
    generation: Property.Number({
      displayName: 'Generation',
      description: 'Optional generation number for versioned objects',
      required: false,
    }),
  },
  async run(context) {
    const { bucket, object, entity, role, generation } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    const aclEntry = {
      entity,
      role,
    };

    let path = `/b/${bucket}/o/${encodeURIComponent(object as string)}/acl`;
    if (generation) {
      path += `?generation=${generation}`;
    }

    try {
      const response = await gcsCommon.makeRequest(
        HttpMethod.POST,
        path,
        auth.access_token,
        aclEntry
      );

      return {
        success: true,
        bucket,
        object,
        generation: generation || 'latest',
        acl: response,
      };
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error('Bad request. This bucket may have uniform bucket-level access enabled, which doesn\'t support object ACLs. Use IAM policies instead.');
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied. You need storage.objects.setIamPolicy permission or OWNER ACL permission on the object.');
      }
      if (error.response?.status === 404) {
        throw new Error(`Object "${object}" not found in bucket "${bucket}".`);
      }
      if (error.response?.status === 409) {
        throw new Error(`ACL entry for entity "${entity}" already exists on this object.`);
      }
      throw new Error(`Failed to create object ACL: ${error.message || 'Unknown error'}`);
    }
  },
});
