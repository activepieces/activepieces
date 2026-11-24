import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../../auth';
import { azureBlobAiProps, azureBlobCommon } from '../../common/client';
import { aiCopyBlobOutputSchema } from '../../output-schemas';

export const aiCopyBlob = createAction({
  auth: azureBlobStorageAuth,
  name: 'azure_blob_copy_blob',
  displayName: 'Copy Blob',
  description: 'Copies a blob to another name or container in the same storage account.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: aiCopyBlobOutputSchema,
  aiMetadata: {
    description:
      'Starts a server-side copy of a blob to a destination container and name in the same storage account; the source is left unchanged. Content, properties and metadata are copied. Returns copyStatus ("success" for most same-account copies, "pending" for large ones that finish in the background; check with Get Blob Properties). With overwrite "no" it fails with BlobAlreadyExists if the destination exists. To move a blob, copy it and then call Delete Blob on the source. Idempotent with overwrite "yes": repeating it leaves the same destination content.',
    idempotent: true,
  },
  props: {
    sourceContainer: Property.ShortText({
      displayName: 'Source Container',
      description: 'Container of the blob to copy.',
      required: true,
    }),
    sourceBlobName: Property.ShortText({
      displayName: 'Source Blob Name',
      description: 'Full name (path) of the blob to copy.',
      required: true,
    }),
    container: azureBlobAiProps.containerName(),
    blobName: azureBlobAiProps.blobName(),
    overwrite: Property.StaticDropdown<string>({
      displayName: 'Overwrite',
      description: 'Whether to replace the destination blob if it already exists.',
      required: false,
      defaultValue: 'yes',
      options: {
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
    }),
  },
  async run(context) {
    const { sourceContainer, sourceBlobName, container, blobName, overwrite } = context.propsValue;
    const client = await azureBlobCommon.getServiceClient({
      connectionString: context.auth.props.connectionString,
    });
    const source = client.getContainerClient(sourceContainer).getBlobClient(sourceBlobName);
    const destination = client.getContainerClient(container).getBlobClient(blobName);
    const state = await azureBlobCommon.callAzure({
      operation: 'copy blob',
      isWrite: true,
      request: async () => {
        const poller = await destination.beginCopyFromURL(source.url, {
          conditions: overwrite === 'no' ? { ifNoneMatch: '*' } : undefined,
        });
        poller.stopPolling();
        return poller.getOperationState();
      },
    });
    const response = state.result;
    return {
      sourceContainer,
      sourceBlobName,
      container,
      blobName,
      copyStatus: response?.copyStatus ?? (state.isCompleted ? null : 'pending'),
      copyId: response?.copyId ?? null,
      etag: response?.etag ?? null,
      lastModified: azureBlobCommon.toIso(response?.lastModified),
      versionId: response?.versionId ?? null,
    };
  },
});
