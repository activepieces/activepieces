import { createAction } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../auth';
import { containerProp } from '../common';
import { azureBlobCommon } from '../common/client';
import { deleteContainerOutputSchema } from '../output-schemas';

export const deleteContainer = createAction({
  auth: azureBlobStorageAuth,
  name: 'deleteContainer',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Container',
  description: 'Deletes a container and all its blobs. Succeeds with deleted false if the container does not exist.',
  audience: 'both',
  outputSchema: deleteContainerOutputSchema,
  aiMetadata: { description: 'Permanently deletes a container and all blobs it holds from the Azure Blob Storage account. Use only to remove an entire container; this is destructive and cannot be undone. Returns deleted true when it was removed and false when it did not exist. Idempotent: repeating the call is safe.', idempotent: true },
  props: {
    container: containerProp,
  },
  async run(context) {
    const { container } = context.propsValue;
    const client = await azureBlobCommon.getServiceClient({
      connectionString: context.auth.props.connectionString,
    });
    const response = await azureBlobCommon.callAzure({
      operation: 'delete container',
      isWrite: true,
      request: () => client.getContainerClient(container).deleteIfExists(),
    });
    return { containerName: container, deleted: response.succeeded };
  },
});
