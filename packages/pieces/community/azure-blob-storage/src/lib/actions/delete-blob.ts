import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../auth';
import { BlobServiceClient } from '@azure/storage-blob';
import { containerProp } from '../common';

export const deleteBlob = createAction({
  auth: azureBlobStorageAuth,
  name: 'deleteBlob',
  displayName: 'Delete Blob',
  description: 'Deletes the Blob at the specified location',
  audience: 'both',
  aiMetadata: { description: 'Deletes the blob at the given container and blob name. Use to remove a single blob; this is destructive. Idempotent: it deletes only if the blob exists, so repeating the call against an already-deleted blob succeeds without error.', idempotent: true },
  props: {
      container: containerProp,
      blobName: Property.ShortText({
        displayName: 'Blob Name',
        description: 'The name of the blob to create',
        required: true,
      })
    },
    async run(context) {
      const { container, blobName } = context.propsValue;
      const auth = context.auth.props;
  
      const blobServiceClient = BlobServiceClient.fromConnectionString(auth.connectionString);
      const containerClient = blobServiceClient.getContainerClient(container);
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      const {_response,...rest} =  await blockBlobClient.deleteIfExists();

      return rest;

    }
});
