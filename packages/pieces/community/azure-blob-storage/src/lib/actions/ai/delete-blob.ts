import { createAction } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../../auth';
import { azureBlobAiProps, azureBlobCommon } from '../../common/client';
import { aiDeleteBlobOutputSchema } from '../../output-schemas';

export const aiDeleteBlob = createAction({
  auth: azureBlobStorageAuth,
  name: 'azure_blob_delete_blob',
  displayName: 'Delete Blob',
  description: 'Deletes a blob and its snapshots if it exists.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  outputSchema: aiDeleteBlobOutputSchema,
  aiMetadata: {
    description:
      'Deletes one blob together with its snapshots. Returns deleted true when the blob was removed and false when it did not exist, so repeating the call is safe. With soft delete enabled on the account the blob can still be recovered in the Azure portal; otherwise the deletion is permanent. Use List Blobs or Get Blob Properties to confirm the exact name first. Idempotent.',
    idempotent: true,
  },
  props: {
    container: azureBlobAiProps.containerName(),
    blobName: azureBlobAiProps.blobName(),
  },
  async run(context) {
    const { container, blobName } = context.propsValue;
    const client = await azureBlobCommon.getServiceClient({
      connectionString: context.auth.props.connectionString,
    });
    const blobClient = client.getContainerClient(container).getBlobClient(blobName);
    const response = await azureBlobCommon.callAzure({
      operation: 'delete blob',
      isWrite: true,
      request: () => blobClient.deleteIfExists({ deleteSnapshots: 'include' }),
    });
    return { container, blobName, deleted: response.succeeded };
  },
});
