import { createAction } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../auth';
import { BlobServiceClient } from '@azure/storage-blob';
import { containerProp } from '../common';

export const deleteContainer = createAction({
  auth: azureBlobStorageAuth,
  name: 'deleteContainer',
  displayName: 'Delete Container',
  description: 'Deletes an existing container',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes a container and all blobs it holds from the Azure Blob Storage account. Use only to remove an entire container; this is destructive and cannot be undone. Not idempotent: a second call against an already-deleted container fails.', idempotent: false },
  props: {
    container: containerProp,
  },
  async run(context) {
    const { container } = context.propsValue;
    const auth = context.auth.props;

    const blobServiceClient = BlobServiceClient.fromConnectionString(auth.connectionString);
    return await blobServiceClient.deleteContainer(container)
  },
});
