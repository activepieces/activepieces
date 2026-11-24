import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../../auth';
import { azureBlobAiProps, azureBlobCommon } from '../../common/client';
import { aiSetBlobMetadataOutputSchema } from '../../output-schemas';

export const aiSetBlobMetadata = createAction({
  auth: azureBlobStorageAuth,
  name: 'azure_blob_set_blob_metadata',
  displayName: 'Set Blob Metadata',
  description: 'Replaces or merges the custom metadata of a blob. This changes the blob Last-Modified time, so it re-fires the New or Updated Blob trigger for that blob.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: aiSetBlobMetadataOutputSchema,
  aiMetadata: {
    description:
      'Sets custom metadata on one blob without changing its content. Mode "replace" (default) makes the given pairs the complete metadata, so an empty object clears it; mode "merge" keeps existing keys and adds or overwrites the given ones. Keys use letters, digits and underscores. Metadata is not searchable; use Set Blob Tags for values you need to search with Find Blobs by Tags. Changing metadata updates the blob Last-Modified time and re-fires the New or Updated Blob trigger. Returns the final metadata. Idempotent: the same input yields the same final metadata.',
    idempotent: true,
  },
  props: {
    container: azureBlobAiProps.containerName(),
    blobName: azureBlobAiProps.blobName(),
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Metadata key/value pairs, e.g. {"source": "crm"}.',
      required: true,
    }),
    mode: Property.StaticDropdown<string>({
      displayName: 'Mode',
      description: 'Replace all metadata, or merge into the existing metadata.',
      required: false,
      defaultValue: 'replace',
      options: {
        options: [
          { label: 'Replace', value: 'replace' },
          { label: 'Merge', value: 'merge' },
        ],
      },
    }),
  },
  async run(context) {
    const { container, blobName, metadata, mode } = context.propsValue;
    const validMetadata = azureBlobCommon.validateMetadata({ metadata });
    const client = await azureBlobCommon.getServiceClient({
      connectionString: context.auth.props.connectionString,
    });
    const blobClient = client.getContainerClient(container).getBlobClient(blobName);
    let finalMetadata = validMetadata;
    let conditions: { ifMatch: string } | undefined;
    if (mode === 'merge') {
      const current = await azureBlobCommon.callAzure({
        operation: 'get blob properties',
        isWrite: false,
        request: () => blobClient.getProperties(),
      });
      finalMetadata = { ...azureBlobCommon.toStringMap(current.metadata), ...validMetadata };
      conditions = current.etag ? { ifMatch: current.etag } : undefined;
    }
    const response = await azureBlobCommon.callAzure({
      operation: 'set blob metadata',
      isWrite: true,
      request: () => blobClient.setMetadata(finalMetadata, { conditions }),
    });
    return {
      container,
      blobName,
      metadata: finalMetadata,
      etag: response.etag ?? null,
      lastModified: azureBlobCommon.toIso(response.lastModified),
    };
  },
});
