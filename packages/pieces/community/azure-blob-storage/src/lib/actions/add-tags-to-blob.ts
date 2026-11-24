import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../auth';
import { containerProp } from '../common';
import { azureBlobCommon } from '../common/client';
import { addTagsToBlobOutputSchema } from '../output-schemas';

export const addTagsToBlob = createAction({
  auth: azureBlobStorageAuth,
  name: 'addTagsToBlob',
  classification: 'WRITE',
  displayName: 'Add Tags to Blob',
  description: 'Adds Tags to the Blob at the specified location. Without Keep Existing Tags the blob gets exactly the tags given here, so leaving Tags empty removes all of its tags.',
  audience: 'human',
  outputSchema: addTagsToBlobOutputSchema,
  aiMetadata: { description: 'Sets key-value tags on the blob at the given container and blob name. Operates in two modes: by default it replaces all existing tags with the supplied set, or with the keep-existing-tags option it merges the new tags onto the current ones. Use to label or categorize a blob for later tag-based search. Idempotent: applying the same tags yields the same final tag set.', idempotent: true },
  props: {
    container: containerProp,
    blobName: Property.ShortText({
      displayName: 'Blob Name',
      description: 'The name of the blob to add tags to',
      required: true,
    }),
    tags: Property.Object({
      displayName: 'Tags',
      description: 'The tags to add to the blob (up to 10 in total). If empty and Keep Existing Tags is off, all tags are removed.',
      required: false,
      defaultValue: {},
    }),
    keepExistingTags: Property.Checkbox({
      displayName: 'Keep Existing Tags',
      description: 'Whether to keep existing tags on the blob',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { container, blobName, tags, keepExistingTags } = context.propsValue;
    const validTags = azureBlobCommon.validateTags({ tags });
    const client = await azureBlobCommon.getServiceClient({
      connectionString: context.auth.props.connectionString,
    });
    const blobClient = client.getContainerClient(container).getBlockBlobClient(blobName);

    let finalTags = validTags;
    if (keepExistingTags) {
      const previous = await azureBlobCommon.callAzure({
        operation: 'get blob tags',
        isWrite: false,
        request: () => blobClient.getTags(),
      });
      finalTags = azureBlobCommon.validateTags({ tags: { ...azureBlobCommon.toStringMap(previous.tags), ...validTags } });
    }

    await azureBlobCommon.callAzure({
      operation: 'set blob tags',
      isWrite: true,
      request: () => blobClient.setTags(finalTags),
    });

    return { container, blobName, tags: finalTags };
  },
});
