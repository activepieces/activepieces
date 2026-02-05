import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { gcsCommon } from '../common/client';
import { bucketDropdown, objectDropdown, projectIdProperty } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const cloneObject = createAction({
  auth: googleCloudStorageAuth,
  name: 'clone_object',
  displayName: 'Clone Object',
  description: 'Copy / clone an object (file) to a new location (same or different bucket), optionally overriding metadata. Perfect for duplicating files as backup or version.',
  props: {
    projectId: projectIdProperty,
    sourceBucket: bucketDropdown,
    sourceObject: objectDropdown('sourceBucket'),
    destBucket: bucketDropdown,
    destObject: Property.ShortText({
      displayName: 'Destination Object Name',
      description: 'Name for the copied object (must be valid object name)',
      required: true,
    }),
    metadataOverrides: Property.Object({
      displayName: 'Metadata Overrides',
      description: 'Optional metadata and properties to override in the copied object (contentType, cacheControl, contentDisposition, etc.)',
      required: false,
    }),
  },
  async run(context) {
    const { sourceBucket, sourceObject, destBucket, destObject, metadataOverrides } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    const body = metadataOverrides || undefined;
    
    try {
      const response = await gcsCommon.makeRequest(
        HttpMethod.POST,
        `/b/${sourceBucket}/o/${encodeURIComponent(sourceObject as string)}/copyTo/b/${destBucket}/o/${encodeURIComponent(destObject as string)}`,
        auth.access_token,
        body
      );

      return {
        success: true,
        source: {
          bucket: sourceBucket,
          object: sourceObject,
        },
        destination: {
          bucket: destBucket,
          object: destObject,
        },
        object: response,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Source object "${sourceObject}" not found in bucket "${sourceBucket}".`);
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied. Check permissions for source and destination buckets.');
      }
      if (error.response?.status === 412) {
        throw new Error('Precondition failed. Source object may have been modified.');
      }
      if (error.response?.status === 409) {
        throw new Error(`Destination object "${destObject}" already exists in bucket "${destBucket}".`);
      }
      if (error.response?.status === 400) {
        throw new Error('Invalid request. Check object names and bucket configurations.');
      }
      throw new Error(`Failed to clone object: ${error.message || 'Unknown error'}`);
    }
  },
});