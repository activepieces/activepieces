import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { gcsCommon } from '../common/client';
import { bucketDropdown, objectDropdown, projectIdProperty } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const cloneObject = createAction({
  auth: googleCloudStorageAuth,
  name: 'clone_object',
  displayName: 'Clone Object',
  description: 'Copy an object from one location to another',
  props: {
    projectId: projectIdProperty,
    sourceBucket: bucketDropdown,
    sourceObject: objectDropdown('sourceBucket'),
    destBucket: bucketDropdown,
    destObject: Property.ShortText({
      displayName: 'Destination Object Name',
      required: true,
    }),
    metadata: Property.Object({
      displayName: 'Metadata Overrides',
      description: 'Optional metadata to override in the copied object',
      required: false,
    }),
  },
  async run(context) {
    const { sourceBucket, sourceObject, destBucket, destObject, metadata } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    const body = metadata ? { metadata } : undefined;
    
    const response = await gcsCommon.makeRequest(
      HttpMethod.POST,
      `/b/${sourceBucket}/o/${encodeURIComponent(sourceObject as string)}/copyTo/b/${destBucket}/o/${encodeURIComponent(destObject as string)}`,
      auth.access_token,
      body
    );
    
    return response;
  },
});