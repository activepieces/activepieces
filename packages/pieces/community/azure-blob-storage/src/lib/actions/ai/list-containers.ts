import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../../auth';
import { azureBlobAiProps, azureBlobCommon } from '../../common/client';
import { aiListContainersOutputSchema } from '../../output-schemas';

export const aiListContainers = createAction({
  auth: azureBlobStorageAuth,
  name: 'azure_blob_list_containers',
  displayName: 'List Containers',
  description: 'Lists containers in the storage account, one page at a time.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: aiListContainersOutputSchema,
  aiMetadata: {
    description:
      'Lists containers in the Azure Storage account, optionally filtered by a name prefix. Returns up to maxResults containers (default 50, max 1000) with last-modified time, ETag, public-access level and metadata, plus nextContinuationToken (null on the last page) to pass back for the next page. Use first to discover container names for List Blobs, Upload Blob and the other blob tools. Read-only.',
    idempotent: true,
  },
  props: {
    prefix: Property.ShortText({
      displayName: 'Name Prefix',
      description: 'Only return containers whose name starts with this text.',
      required: false,
    }),
    maxResults: azureBlobAiProps.maxResults(),
    continuationToken: azureBlobAiProps.continuationToken(),
  },
  async run(context) {
    const { prefix, maxResults, continuationToken } = context.propsValue;
    const pageSize = azureBlobCommon.clampMaxResults({
      value: maxResults,
      fallback: azureBlobCommon.DEFAULT_MAX_RESULTS,
    });
    const client = await azureBlobCommon.getServiceClient({
      connectionString: context.auth.props.connectionString,
    });
    const page = await azureBlobCommon.callAzure({
      operation: 'list containers',
      isWrite: false,
      request: async () => {
        const result = await client
          .listContainers({ includeMetadata: true, prefix: azureBlobCommon.emptyToUndefined(prefix) })
          .byPage({
            maxPageSize: pageSize,
            continuationToken: azureBlobCommon.emptyToUndefined(continuationToken),
          })
          .next();
        return result.done ? null : result.value;
      },
    });
    const containers = (page?.containerItems ?? []).map((item) => azureBlobCommon.mapContainerItem(item));
    return {
      containers,
      count: containers.length,
      nextContinuationToken: azureBlobCommon.emptyToUndefined(page?.continuationToken) ?? null,
    };
  },
});
