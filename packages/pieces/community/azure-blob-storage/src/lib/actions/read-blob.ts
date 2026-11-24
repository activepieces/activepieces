import { PassThrough } from 'node:stream';
import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../auth';
import { containerProp } from '../common';
import { azureBlobCommon } from '../common/client';

export const readBlob = createAction({
  auth: azureBlobStorageAuth,
  name: 'readBlob',
  classification: 'READ',
  displayName: 'Read Blob',
  description: 'Read the Blob at the specified location',
  audience: 'human',
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
    const client = await azureBlobCommon.getServiceClient({
      connectionString: context.auth.props.connectionString,
    });
    const blobClient = client.getContainerClient(container).getBlobClient(blobName);

    const downloadBlockBlobResponse = await azureBlobCommon.callAzure({
      operation: 'read blob',
      isWrite: false,
      request: () => blobClient.download(),
    });
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
