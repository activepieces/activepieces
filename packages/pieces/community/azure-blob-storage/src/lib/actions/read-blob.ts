import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../../index';
import { BlobServiceClient } from '@azure/storage-blob';
import { containerProp } from '../common';

async function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', (data) => {
      chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on('error', reject);
  });
};

export const readBlob = createAction({
  auth: azureBlobStorageAuth,
  name: 'readBlob',
  displayName: 'Read Blob',
  description: 'Read the Blob at the specified lcoation',
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
        data: await streamToBuffer(downloadBlockBlobResponse.readableStreamBody)
      });
    } else {
      throw new Error('Failed to read blob stream');
    }
  },
});
