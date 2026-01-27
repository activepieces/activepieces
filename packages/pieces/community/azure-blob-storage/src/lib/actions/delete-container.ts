import { createAction } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../../index';
import { BlobServiceClient } from '@azure/storage-blob';
import { containerProp } from '../common';

export const deleteContainer = createAction({
  auth: azureBlobStorageAuth,
  name: 'deleteContainer',
  displayName: 'Delete Container',
  description: 'Deletes an existing container',
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
