import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../auth';
import { containerProp } from '../common';
import { azureBlobCommon } from '../common/client';
import { listBlobsOutputSchema } from '../output-schemas';

export const listBlobs = createAction({
  auth: azureBlobStorageAuth,
  name: 'listBlobs',
  classification: 'SEARCH',
  displayName: 'List Blobs',
  description: 'List Blobs in the specified Azure Blob Storage container',
  audience: 'human',
  outputSchema: listBlobsOutputSchema,
  aiMetadata: { description: 'Lists the blobs in a given container, returning each blob name with its properties and metadata. Use to enumerate or discover blobs before reading or processing them; optionally narrow by a name prefix and include snapshots. Read-only and idempotent.', idempotent: true },
  props: {
    container: containerProp,
    includeSnapshots: Property.Checkbox({
      displayName: 'Include Snapshots',
      description: 'Whether to include snapshots in the list',
      required: false,
      defaultValue: false,
    }),
    prefix: Property.ShortText({
      displayName: 'Prefix Filter',
      description: 'Filter blobs by prefix',
      required: false,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'Stop after this many blobs. Leave empty to list all of them.',
      required: false,
    }),
  },
  async run(context) {
    const { container, includeSnapshots, prefix, maxResults } = context.propsValue;
    const limit = maxResults === undefined || maxResults === null ? null : Math.max(1, Math.floor(maxResults));
    const client = await azureBlobCommon.getServiceClient({
      connectionString: context.auth.props.connectionString,
    });
    const containerClient = client.getContainerClient(container);

    return azureBlobCommon.callAzure({
      operation: 'list blobs',
      isWrite: false,
      request: async () => {
        const blobs: { name: string; properties: unknown; metadata: Record<string, string> }[] = [];
        for await (const blob of containerClient.listBlobsFlat({
          includeSnapshots: includeSnapshots ?? false,
          includeMetadata: true,
          prefix: azureBlobCommon.emptyToUndefined(prefix),
        })) {
          blobs.push({
            name: blob.name,
            properties: blob.properties,
            metadata: azureBlobCommon.toStringMap(blob.metadata),
          });
          if (limit !== null && blobs.length >= limit) {
            break;
          }
        }
        return blobs;
      },
    });
  },
});
