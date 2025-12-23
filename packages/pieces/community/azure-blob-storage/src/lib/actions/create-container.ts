import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../../index';
import { BlobServiceClient } from '@azure/storage-blob';

export const createContainer = createAction({
  auth: azureBlobStorageAuth,
  name: 'createContainer',
  displayName: 'Create Container',
  description: 'Create a new container',
  props: {
    containerName: Property.ShortText({
      displayName: 'Container Name',
      description: 'The name for the newly created container',
      required: true
    }),
  },
  async run(context) {
    const { containerName } = context.propsValue;
    const auth = context.auth.props;

    const blobServiceClient = BlobServiceClient.fromConnectionString(auth.connectionString);
    const containerClient = await blobServiceClient.createContainer(containerName);

    return containerClient;
  },
});
