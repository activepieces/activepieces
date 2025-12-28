import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../../index';
import { BlobServiceClient } from '@azure/storage-blob';

export const createContainer = createAction({
  auth: azureBlobStorageAuth,
  name: 'createContainer',
  displayName: 'Create Container',
  description: 'Creates a new container',
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
