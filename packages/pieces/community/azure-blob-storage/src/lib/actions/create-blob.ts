import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../../index';
import { BlobServiceClient, Tags } from '@azure/storage-blob';
import { containerProp } from '../common';

export const createBlob = createAction({
  auth: azureBlobStorageAuth,
  name: 'createBlob',
  displayName: 'Create Blob',
  description: 'Creates a new Blob in the specified location',
  props: {
      container: containerProp,
      blobName: Property.ShortText({
        displayName: 'Blob Name',
        description: 'The name of the blob to create',
        required: true,
      }),
      file: Property.File({
        displayName: 'File',
        description: 'The file to upload as a blob',
        required: true,
      }),
      tags: Property.Object({
        displayName: 'Tags',
        description: 'Optional tags to associate with the blob',
        required: false,
      }),
    },
    async run(context) {
      const { container, blobName, file, tags } = context.propsValue;
      const auth = context.auth.props;
  
      const blobServiceClient = BlobServiceClient.fromConnectionString(auth.connectionString);
      const containerClient = blobServiceClient.getContainerClient(container);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      return await blockBlobClient.uploadData(file.data, { tags: tags as Tags });
    },
});
