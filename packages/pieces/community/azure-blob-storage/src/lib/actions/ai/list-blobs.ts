import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../../auth';
import { azureBlobAiProps, azureBlobCommon } from '../../common/client';
import { aiListBlobsOutputSchema } from '../../output-schemas';

export const aiListBlobs = createAction({
  auth: azureBlobStorageAuth,
  name: 'azure_blob_list_blobs',
  displayName: 'List Blobs',
  description: 'Lists blobs in a container, one page at a time, optionally as a folder view.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: aiListBlobsOutputSchema,
  aiMetadata: {
    description:
      'Lists blobs in one container, optionally filtered by a name prefix. Returns up to maxResults blobs (default 50, max 1000) with size, content type, last-modified time, ETag, access tier and metadata, plus nextContinuationToken (null on the last page). Set delimiter to "/" for a folder view: blobs directly under the prefix are returned in blobs and sub-folders in prefixes. Use Get Blob Properties for one known blob and Find Blobs by Tags to search by tag. Read-only.',
    idempotent: true,
  },
  props: {
    container: azureBlobAiProps.containerName(),
    prefix: Property.ShortText({
      displayName: 'Name Prefix',
      description: 'Only return blobs whose name starts with this text, e.g. "reports/2024/".',
      required: false,
    }),
    delimiter: Property.ShortText({
      displayName: 'Delimiter',
      description: 'Set to "/" to list one folder level; leave empty for a flat list of every blob.',
      required: false,
    }),
    maxResults: azureBlobAiProps.maxResults(),
    continuationToken: azureBlobAiProps.continuationToken(),
  },
  async run(context) {
    const { container, prefix, delimiter, maxResults, continuationToken } = context.propsValue;
    const pageSize = azureBlobCommon.clampMaxResults({
      value: maxResults,
      fallback: azureBlobCommon.DEFAULT_MAX_RESULTS,
    });
    const client = await azureBlobCommon.getServiceClient({
      connectionString: context.auth.props.connectionString,
    });
    const containerClient = client.getContainerClient(container);
    const options = { includeMetadata: true, prefix: azureBlobCommon.emptyToUndefined(prefix) };
    const pageOptions = {
      maxPageSize: pageSize,
      continuationToken: azureBlobCommon.emptyToUndefined(continuationToken),
    };
    const delimiterValue = azureBlobCommon.emptyToUndefined(delimiter);

    return azureBlobCommon.callAzure({
      operation: 'list blobs',
      isWrite: false,
      request: async () => {
        if (delimiterValue) {
          const result = await containerClient
            .listBlobsByHierarchy(delimiterValue, options)
            .byPage(pageOptions)
            .next();
          const page = result.done ? null : result.value;
          const blobs = (page?.segment.blobItems ?? []).map((item) => azureBlobCommon.mapBlobItem(item));
          return {
            container,
            blobs,
            prefixes: (page?.segment.blobPrefixes ?? []).map((item) => item.name),
            count: blobs.length,
            nextContinuationToken: azureBlobCommon.emptyToUndefined(page?.continuationToken) ?? null,
          };
        }
        const result = await containerClient.listBlobsFlat(options).byPage(pageOptions).next();
        const page = result.done ? null : result.value;
        const blobs = (page?.segment.blobItems ?? []).map((item) => azureBlobCommon.mapBlobItem(item));
        return {
          container,
          blobs,
          prefixes: [],
          count: blobs.length,
          nextContinuationToken: azureBlobCommon.emptyToUndefined(page?.continuationToken) ?? null,
        };
      },
    });
  },
});
