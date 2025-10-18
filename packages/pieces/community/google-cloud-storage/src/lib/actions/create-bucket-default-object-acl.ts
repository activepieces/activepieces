import { createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { gcsCommon } from '../common/client';
import { bucketDropdown, aclEntityProperty, aclRoleProperty, projectIdProperty } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const createBucketDefaultObjectAcl = createAction({
  auth: googleCloudStorageAuth,
  name: 'create_bucket_default_object_acl',
  displayName: 'Create Bucket Default Object ACL',
  description: 'Create a default access control entry for new objects in a bucket',
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
      `/b/${bucket}/defaultObjectAcl`,
      auth.access_token,
      aclEntry
    );
    
    return response;
  },
});