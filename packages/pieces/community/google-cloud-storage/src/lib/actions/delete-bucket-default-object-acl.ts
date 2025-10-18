import { createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { gcsCommon } from '../common/client';
import { bucketDropdown, aclEntityProperty, projectIdProperty } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteBucketDefaultObjectAcl = createAction({
  auth: googleCloudStorageAuth,
  name: 'delete_bucket_default_object_acl',
  displayName: 'Delete Bucket Default Object ACL',
  description: 'Delete a default access control entry for new objects in a bucket',
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
      `/b/${bucket}/defaultObjectAcl/${encodeURIComponent(entity)}`,
      auth.access_token
    );
    
    return {
      success: true,
      message: `Default object ACL entry for entity ${entity} deleted successfully from bucket ${bucket}`,
    };
  },
});