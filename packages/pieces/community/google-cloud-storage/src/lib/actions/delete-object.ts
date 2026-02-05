import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { gcsCommon } from '../common/client';
import { bucketDropdown, objectDropdown, projectIdProperty } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteObject = createAction({
  auth: googleCloudStorageAuth,
  name: 'delete_object',
  displayName: 'Delete Object',
  description: 'Permanently delete a specific object. Perfect for removing obsolete files.',
  props: {
    projectId: projectIdProperty,
    bucket: bucketDropdown,
    object: objectDropdown('bucket'),
    generation: Property.Number({
      displayName: 'Generation',
      description: 'Optional generation number for versioned objects (permanently deletes a specific revision)',
      required: false,
    }),
  },
  async run(context) {
    const { bucket, object, generation } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    let path = `/b/${bucket}/o/${encodeURIComponent(object as string)}`;
    if (generation) {
      path += `?generation=${generation}`;
    }

    try {
      await gcsCommon.makeRequest(HttpMethod.DELETE, path, auth.access_token);

      return {
        success: true,
        bucket,
        object,
        generation: generation || 'latest',
        message: `Object "${object}" deleted successfully from bucket "${bucket}"`,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Object "${object}" not found in bucket "${bucket}". It may have already been deleted.`);
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied. You need storage.objects.delete permission to delete this object.');
      }
      if (error.response?.status === 412) {
        throw new Error('Precondition failed. Object may have been modified or deleted by another process.');
      }
      if (error.response?.status === 400) {
        throw new Error('Invalid request. Check object name and generation parameters.');
      }
      throw new Error(`Failed to delete object: ${error.message || 'Unknown error'}`);
    }
  },
});