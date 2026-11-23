import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../../auth';
import { azureBlobAiProps, azureBlobCommon } from '../../common/client';
import { aiBlobTagsOutputSchema } from '../../output-schemas';

export const aiSetBlobTags = createAction({
  auth: azureBlobStorageAuth,
  name: 'azure_blob_set_blob_tags',
  displayName: 'Set Blob Tags',
  description: 'Replaces or merges the index tags of a blob.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: aiBlobTagsOutputSchema,
  aiMetadata: {
    description:
      'Sets index tags on one blob. Mode "replace" (default) makes the given tags the complete set, so an empty tags object removes all tags; mode "merge" keeps existing tags and adds or overwrites the given keys. A blob can hold at most 10 tags with text values. Returns the final tag set. Use Get Blob Tags to read tags and Find Blobs by Tags to search by them. Idempotent: the same input yields the same final tags.',
    idempotent: true,
  },
  props: {
    container: azureBlobAiProps.containerName(),
    blobName: azureBlobAiProps.blobName(),
    tags: Property.Object({
      displayName: 'Tags',
      description: 'Tag key/value pairs, e.g. {"status": "processed"}.',
      required: true,
    }),
    mode: Property.StaticDropdown<string>({
      displayName: 'Mode',
      description: 'Replace all tags, or merge into the existing tags.',
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
    const { container, blobName, tags, mode } = context.propsValue;
    const validTags = azureBlobCommon.validateTags({ tags });
    const client = await azureBlobCommon.getServiceClient({
      connectionString: context.auth.props.connectionString,
    });
    const blobClient = client.getContainerClient(container).getBlobClient(blobName);
    let finalTags = validTags;
    if (mode === 'merge') {
      const current = await azureBlobCommon.callAzure({
        operation: 'get blob tags',
        isWrite: false,
        request: () => blobClient.getTags(),
      });
      finalTags = azureBlobCommon.validateTags({ tags: { ...azureBlobCommon.toStringMap(current.tags), ...validTags } });
    }
    await azureBlobCommon.callAzure({
      operation: 'set blob tags',
      isWrite: true,
      request: () => blobClient.setTags(finalTags),
    });
    return { container, blobName, tags: finalTags, tagCount: Object.keys(finalTags).length };
  },
});
