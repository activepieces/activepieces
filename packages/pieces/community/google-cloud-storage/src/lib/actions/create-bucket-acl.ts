import { createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { gcsCommon } from '../common/client';
import { bucketDropdown, aclEntityProperty, aclRoleProperty, projectIdProperty } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const createBucketAcl = createAction({
  auth: googleCloudStorageAuth,
  name: 'create_bucket_acl',
  displayName: 'Create Bucket ACL',
  description: 'Create an access control entry for a bucket',
  props: {
    projectId: projectIdProperty,
    bucket: bucketDropdown,
    entity: aclEntityProperty,
    role: aclRoleProperty,
  },
  async run(context) {
    const { bucket, entity, role } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    const aclEntry = {
      entity,
      role,
    };

    const response = await gcsCommon.makeRequest(
      HttpMethod.POST,
      `/b/${bucket}/acl`,
      auth.access_token,
      aclEntry
    );
    
    return response;
  },
});