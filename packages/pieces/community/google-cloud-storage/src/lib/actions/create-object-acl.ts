import {
  createAction,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { gcsCommon } from '../common/client';
import {
  bucketDropdown,
  objectDropdown,
  aclEntityProperty,
  aclRoleProperty,
  projectIdProperty,
} from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const createObjectAcl = createAction({
  auth: googleCloudStorageAuth,
  name: 'create_object_acl',
  displayName: 'Create Object ACL',
  description: 'Create an access control entry for an object',
  props: {
    projectId: projectIdProperty,
    bucket: bucketDropdown,
    object: objectDropdown('bucket'),
    entity: aclEntityProperty,
    role: aclRoleProperty,
  },
  async run(context) {
    const { bucket, object, entity, role } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    const aclEntry = {
      entity,
      role,
    };

    const response = await gcsCommon.makeRequest(
      HttpMethod.POST,
      `/b/${bucket}/o/${encodeURIComponent(object as string)}/acl`,
      auth.access_token,
      aclEntry
    );

    return response;
  },
});
