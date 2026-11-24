import { createAction } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../../auth';
import { azureBlobAiProps, azureBlobCommon } from '../../common/client';
import { aiBlobTagsOutputSchema } from '../../output-schemas';

export const aiGetBlobTags = createAction({
  auth: azureBlobStorageAuth,
  name: 'azure_blob_get_blob_tags',
  displayName: 'Get Blob Tags',
  description: 'Gets the index tags of a blob.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: aiBlobTagsOutputSchema,
  aiMetadata: {
    description:
      'Returns the index tags (up to 10 key/value pairs) set on one blob, as a tags object plus tagCount. Use before Set Blob Tags to see current values, or to read tags of a blob found with Find Blobs by Tags. Read-only.',
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
      operation: 'get blob tags',
      isWrite: false,
      request: () => blobClient.getTags(),
    });
    const tags = azureBlobCommon.toStringMap(response.tags);
    return { container, blobName, tags, tagCount: Object.keys(tags).length };
  },
});
