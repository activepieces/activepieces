import { PassThrough } from 'node:stream';
import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../auth';
import { BlobServiceClient } from '@azure/storage-blob';
import { containerProp } from '../common';

export const readBlob = createAction({
  auth: azureBlobStorageAuth,
  name: 'readBlob',
  displayName: 'Read Blob',
  description: 'Read the Blob at the specified lcoation',
  audience: 'both',
  aiMetadata: { description: 'Downloads the blob at the given container and blob name and returns it as a file. Use to fetch the contents of a known blob for downstream processing; the blob name must already exist. Read-only and idempotent.', idempotent: true },
  props: {
    container: containerProp,
    blobName: Property.ShortText({
      displayName: 'Blob Name',
      description: 'The name of the blob to read',
      required: true,
    }),
  },
  async run(context) {
    const { container, blobName } = context.propsValue;
    const auth = context.auth.props;

    const blobServiceClient = BlobServiceClient.fromConnectionString(auth.connectionString);
    const containerClient = blobServiceClient.getContainerClient(container);
    const blobClient = containerClient.getBlobClient(blobName);

    const downloadBlockBlobResponse = await blobClient.download();
    if (downloadBlockBlobResponse.readableStreamBody) {
      return await context.files.write({
        fileName: blobName.split('/').pop() || 'downloaded_blob',
        data: downloadBlockBlobResponse.readableStreamBody.pipe(new PassThrough())
      });
    } else {
      throw new Error('Failed to read blob stream');
    }
  },
});
