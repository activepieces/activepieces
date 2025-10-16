import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { gcsCommon } from '../common/client';
import { bucketDropdown, objectDropdown, projectIdProperty } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteObject = createAction({
  auth: googleCloudStorageAuth,
  name: 'delete_object',
  displayName: 'Delete Object',
  description: 'Delete an object from Google Cloud Storage',
  props: {
    projectId: projectIdProperty,
    bucket: bucketDropdown,
    object: objectDropdown('bucket'),
    generation: Property.ShortText({
      displayName: 'Generation',
      description: 'Optional generation number for versioned objects',
      required: false,
    }),
  },
  async run(context) {
    const { bucket, object, generation } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    let path = `/b/${bucket}/o/${encodeURIComponent(object)}`;
    if (generation) {
      path += `?generation=${generation}`;
    }

    await gcsCommon.makeRequest(HttpMethod.DELETE, path, auth.access_token);
    
    return {
      success: true,
      message: `Object ${object} deleted successfully from bucket ${bucket}`,
    };
  },
});