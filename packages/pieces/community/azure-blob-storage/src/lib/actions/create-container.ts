import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../auth';
import { BlobServiceClient } from '@azure/storage-blob';

export const createContainer = createAction({
  auth: azureBlobStorageAuth,
  name: 'createContainer',
  displayName: 'Create Container',
  description: 'Creates a new container',
  audience: 'both',
  aiMetadata: { description: 'Creates a new container in the Azure Blob Storage account with the given name. Use when you need a fresh container to store blobs. Not idempotent: the container name must not already exist or the call fails.', idempotent: false },
  props: {
    containerName: Property.ShortText({
      displayName: 'Container Name',
      description: 'The name for the newly created container',
      required: true,
    }),
  },
  async run(context) {
    const { containerName } = context.propsValue;
    const auth = context.auth.props;

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      auth.connectionString
    );
    const { containerCreateResponse, containerClient } =
      await blobServiceClient.createContainer(containerName);

    return {
      ...containerCreateResponse,
      containerName: containerClient.containerName,
      accountName: containerClient.accountName,
    };
  },
});
