import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../auth';
import { containerProp } from '../common';
import { azureBlobCommon } from '../common/client';
import { deleteBlobOutputSchema } from '../output-schemas';

export const deleteBlob = createAction({
  auth: azureBlobStorageAuth,
  name: 'deleteBlob',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Blob',
  description: 'Deletes the Blob at the specified location',
  audience: 'human',
  outputSchema: deleteBlobOutputSchema,
  aiMetadata: { description: 'Deletes the blob at the given container and blob name. Use to remove a single blob; this is destructive. Idempotent: it deletes only if the blob exists, so repeating the call against an already-deleted blob succeeds without error.', idempotent: true },
  props: {
    container: containerProp,
    blobName: Property.ShortText({
      displayName: 'Blob Name',
      description: 'The name of the blob to delete',
      required: true,
    }),
  },
  async run(context) {
    const { container, blobName } = context.propsValue;
    const client = await azureBlobCommon.getServiceClient({
      connectionString: context.auth.props.connectionString,
    });
    const blobClient = client.getContainerClient(container).getBlockBlobClient(blobName);
    const response = await azureBlobCommon.callAzure({
      operation: 'delete blob',
      isWrite: true,
      request: () => blobClient.deleteIfExists(),
    });
    return { container, blobName, deleted: response.succeeded };
  },
});
