import { createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { gcsCommon } from '../common/client';
import { bucketDropdown, aclEntityProperty, projectIdProperty } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteBucketAcl = createAction({
  auth: googleCloudStorageAuth,
  name: 'delete_bucket_acl',
  displayName: 'Delete Bucket ACL',
  description: 'Delete an access control entry for a bucket',
  props: {
    projectId: projectIdProperty,
    bucket: bucketDropdown,
    entity: aclEntityProperty,
  },
  async run(context) {
    const { bucket, entity } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    await gcsCommon.makeRequest(
      HttpMethod.DELETE,
      `/b/${bucket}/acl/${encodeURIComponent(entity)}`,
      auth.access_token
    );
    
    return {
      success: true,
      message: `ACL entry for entity ${entity} deleted successfully from bucket ${bucket}`,
    };
  },
});