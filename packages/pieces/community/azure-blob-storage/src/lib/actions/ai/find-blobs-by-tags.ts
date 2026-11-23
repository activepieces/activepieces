import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../../auth';
import { azureBlobAiProps, azureBlobCommon } from '../../common/client';
import { aiFindBlobsByTagsOutputSchema } from '../../output-schemas';

export const aiFindBlobsByTags = createAction({
  auth: azureBlobStorageAuth,
  name: 'azure_blob_find_blobs_by_tags',
  displayName: 'Find Blobs by Tags',
  description: 'Finds blobs whose index tags match all given values.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: aiFindBlobsByTagsOutputSchema,
  aiMetadata: {
    description:
      'Finds blobs whose index tags equal every given key/value pair (AND), within one container or across the whole account when container is empty. Returns up to maxResults matches (default 50, max 1000) with blob name, container and the matched tags, plus nextContinuationToken. The tag index updates asynchronously, so a blob tagged seconds ago may not appear yet. Use List Blobs to search by name prefix instead. Read-only.',
    idempotent: true,
  },
  props: {
    tags: Property.Object({
      displayName: 'Tags',
      description: 'Tag key/value pairs that must all match, e.g. {"status": "processed"}.',
      required: true,
    }),
    container: Property.ShortText({
      displayName: 'Container Name',
      description: 'Limit the search to this container. Leave empty to search the whole account.',
      required: false,
    }),
    maxResults: azureBlobAiProps.maxResults(),
    continuationToken: azureBlobAiProps.continuationToken(),
  },
  async run(context) {
    const { tags, container, maxResults, continuationToken } = context.propsValue;
    const pageSize = azureBlobCommon.clampMaxResults({
      value: maxResults,
      fallback: azureBlobCommon.DEFAULT_MAX_RESULTS,
    });
    const query = azureBlobCommon.buildTagFilter({
      tags: azureBlobCommon.validateTags({ tags }),
      container: azureBlobCommon.emptyToUndefined(container),
    });
    const client = await azureBlobCommon.getServiceClient({
      connectionString: context.auth.props.connectionString,
    });
    const page = await azureBlobCommon.callAzure({
      operation: 'find blobs by tags',
      isWrite: false,
      request: async () => {
        const result = await client
          .findBlobsByTags(query)
          .byPage({
            maxPageSize: pageSize,
            continuationToken: azureBlobCommon.emptyToUndefined(continuationToken),
          })
          .next();
        return result.done ? null : result.value;
      },
    });
    const blobs = (page?.blobs ?? []).map((blob) => ({
      name: blob.name,
      container: blob.containerName,
      tags: azureBlobCommon.toStringMap(blob.tags),
    }));
    return {
      blobs,
      count: blobs.length,
      nextContinuationToken: azureBlobCommon.emptyToUndefined(page?.continuationToken) ?? null,
    };
  },
});
