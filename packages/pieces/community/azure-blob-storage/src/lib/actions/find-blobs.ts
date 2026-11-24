import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../auth';
import { containerProp } from '../common';
import { azureBlobCommon } from '../common/client';
import { findBlobsOutputSchema } from '../output-schemas';

export const findBlobs = createAction({
  auth: azureBlobStorageAuth,
  name: 'findBlobs',
  classification: 'SEARCH',
  displayName: 'Find Blobs',
  description: 'Finds Blobs based on their tags',
  audience: 'human',
  outputSchema: findBlobsOutputSchema,
  aiMetadata: { description: 'Searches a container for blobs matching the supplied tag key-value pairs, returning the names of blobs whose tags satisfy all conditions (combined with AND). Use to locate blobs by tag rather than by name or prefix. Read-only and idempotent.', idempotent: true },
  props: {
    container: containerProp,
    tags: Property.Object({
      displayName: 'Tags',
      description: 'The tags to filter blobs by',
      required: true,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'Stop after this many blobs. Leave empty to return all matches.',
      required: false,
    }),
  },
  async run(context) {
    const { container, tags, maxResults } = context.propsValue;
    const limit = maxResults === undefined || maxResults === null ? null : Math.max(1, Math.floor(maxResults));
    const tagQuery = azureBlobCommon.buildTagFilter({
      tags: azureBlobCommon.validateTags({ tags }),
    });
    const client = await azureBlobCommon.getServiceClient({
      connectionString: context.auth.props.connectionString,
    });
    const containerClient = client.getContainerClient(container);

    return azureBlobCommon.callAzure({
      operation: 'find blobs by tags',
      isWrite: false,
      request: async () => {
        const blobs: { name: string; container: string; tags: Record<string, string> }[] = [];
        for await (const blob of containerClient.findBlobsByTags(tagQuery)) {
          blobs.push({ name: blob.name, container: blob.containerName, tags: azureBlobCommon.toStringMap(blob.tags) });
          if (limit !== null && blobs.length >= limit) {
            break;
          }
        }
        return blobs;
      },
    });
  },
});
