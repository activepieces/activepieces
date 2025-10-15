import { createAction, Property } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { googleCloudStorageProps } from '../common/props';
import { GoogleCloudStorageClient } from '../common/client';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const cloneObject = createAction({
  auth: googleCloudStorageAuth,
  name: 'clone_object',
  displayName: 'Clone Object',
  description: 'Copy an object to a new location, optionally overriding metadata.',
  props: {
    source_project: googleCloudStorageProps.project('Source Project'),
    source_bucket: googleCloudStorageProps.bucket('Source Bucket', ['source_project']),
    source_object: googleCloudStorageProps.object('Source Object', ['source_bucket']),
    destination_project: googleCloudStorageProps.project('Destination Project'),
    destination_bucket: googleCloudStorageProps.bucket('Destination Bucket', ['destination_project']),
    
    destination_object: Property.ShortText({
        displayName: 'Destination Object Name',
        description: "The full path and name for the new object (e.g., 'backups/photo-copy.jpg'). If left empty, the source name will be used.",
        required: false,
    }),
    metadata: Property.Json({
        displayName: 'New Metadata (Optional)',
        description: 'A JSON object to override the destination object metadata. If empty, metadata will be copied from the source.',
        required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new GoogleCloudStorageClient(
      (auth as OAuth2PropertyValue).access_token
    );

    const destinationObjectName = propsValue.destination_object || propsValue.source_object;

    return await client.cloneObject({
        sourceBucket: propsValue.source_bucket,
        sourceObject: propsValue.source_object,
        destinationBucket: propsValue.destination_bucket,
        destinationObject: destinationObjectName,
        metadata: propsValue.metadata as any,
    });
  },
});