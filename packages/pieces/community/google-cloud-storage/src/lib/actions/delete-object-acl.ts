import { createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { gcsCommon } from '../common/client';
import { bucketDropdown, objectDropdown, aclEntityProperty, projectIdProperty } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteObjectAcl = createAction({
  auth: googleCloudStorageAuth,
  name: 'delete_object_acl',
  displayName: 'Delete Object ACL',
  description: 'Delete an access control entry for an object',
  props: {
    projectId: projectIdProperty,
    bucket: bucketDropdown,
    object: objectDropdown('bucket'),
    entity: aclEntityProperty,
  },
  async run(context) {
    const { bucket, object, entity } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    await gcsCommon.makeRequest(
      HttpMethod.DELETE,
      `/b/${bucket}/o/${encodeURIComponent(object as string)}/acl/${encodeURIComponent(entity as string)}`,
      auth.access_token
    );
    
    return {
      success: true,
      message: `ACL entry for entity ${entity} deleted successfully from object ${object}`,
    };
  },
});