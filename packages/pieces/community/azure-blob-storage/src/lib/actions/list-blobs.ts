import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../../index';
import { BlobServiceClient } from '@azure/storage-blob';
import { containerProp } from '../common';

export const listBlobs = createAction({
  auth: azureBlobStorageAuth,
  name: 'listBlobs',
  displayName: 'List Blobs',
  description: 'List Blobs in the specified Azure Blob Storage container',
  props: {
    container: containerProp,
    includeSnapshots: Property.Checkbox({
      displayName: 'Include Snapshots',
      description: 'Whether to include snapshots in the list',
      required: false,
      defaultValue: false,
    }),
    prefix: Property.ShortText({
      displayName: 'Prefix Filter',
      description: 'Filter blobs by prefix',
      required: false,
    }),
  },
  async run(context) {
    const { container, includeSnapshots, prefix } = context.propsValue;
    const auth = context.auth.props;

    const blobServiceClient = BlobServiceClient.fromConnectionString(auth.connectionString);
    const containerClient = blobServiceClient.getContainerClient(container);

    const options = {
      includeSnapshots: includeSnapshots,
      includeMetadata: true,
      prefix: prefix,
    };

    const blobs = [];
    for await (const blob of containerClient.listBlobsFlat(options)) {
      blobs.push({
        name: blob.name,
        properties: blob.properties,
        metadata: blob.metadata,
      });
    };

    return blobs;
  },
});
