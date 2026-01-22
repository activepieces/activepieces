import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../../index';
import { BlobServiceClient } from '@azure/storage-blob';
import { containerProp } from '../common';

export const findBlobs = createAction({
  auth: azureBlobStorageAuth,
  name: 'findBlobs',
  displayName: 'Find Blobs',
  description: 'Finds Blobs based on their tags',
  props: {
    container: containerProp,
    tags: Property.Object({
      displayName: 'Tags',
      description: 'The tags to filter blobs by',
      required: true,
    }),
  },
  async run(context) {
    const { container, tags } = context.propsValue;
    const auth = context.auth.props;
    
    const blobServiceClient = BlobServiceClient.fromConnectionString(auth.connectionString);
    const containerClient = blobServiceClient.getContainerClient(container);

    const tagExpressions = Object.entries(tags).map(([key, value]) => `${key}='${value}'`);
    const tagQuery = tagExpressions.join(' AND ');

    const blobs = [];
    for await (const blob of containerClient.findBlobsByTags(tagQuery)) {
      blobs.push({
        name: blob.name
      });
    };

    return blobs;
  },
});
