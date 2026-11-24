import { createAction, Property } from '@activepieces/pieces-framework';
import { azureBlobStorageAuth } from '../auth';
import { azureBlobCommon } from '../common/client';
import { listContainersOutputSchema } from '../output-schemas';

export const listContainers = createAction({
  auth: azureBlobStorageAuth,
  name: 'listContainers',
  classification: 'SEARCH',
  displayName: 'List Containers',
  description: 'List Containers in the Azure Blob Storage account',
  audience: 'human',
  outputSchema: listContainersOutputSchema,
  aiMetadata: { description: 'Lists the containers in an Azure Blob Storage account. Use to discover available containers before reading or writing blobs; optionally narrow results with a name prefix and toggle inclusion of deleted or system containers. Read-only and idempotent.', idempotent: true },
  props: {
    includeDeleted: Property.Checkbox({
      displayName: 'Include Deleted Containers',
      description: 'Whether to include deleted containers in the list',
      required: false,
      defaultValue: false,
    }),
    includeSystem: Property.Checkbox({
      displayName: 'Include System Containers',
      description: 'Whether to include system containers in the list',
      required: false,
      defaultValue: true,
    }),
    prefix: Property.ShortText({
      displayName: 'Prefix Filter',
      description: 'Filter containers by prefix',
      required: false,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'Stop after this many containers. Leave empty to list all of them.',
      required: false,
    }),
  },
  async run(context) {
    const { includeDeleted, includeSystem, prefix, maxResults } = context.propsValue;
    const limit = maxResults === undefined || maxResults === null ? null : Math.max(1, Math.floor(maxResults));
    const client = await azureBlobCommon.getServiceClient({
      connectionString: context.auth.props.connectionString,
    });

    return azureBlobCommon.callAzure({
      operation: 'list containers',
      isWrite: false,
      request: async () => {
        const containers: { name: string; properties: unknown; metadata: Record<string, string> }[] = [];
        for await (const container of client.listContainers({
          includeDeleted: includeDeleted ?? false,
          includeMetadata: true,
          includeSystem: includeSystem ?? true,
          prefix: azureBlobCommon.emptyToUndefined(prefix),
        })) {
          containers.push({
            name: container.name,
            properties: container.properties,
            metadata: azureBlobCommon.toStringMap(container.metadata),
          });
          if (limit !== null && containers.length >= limit) {
            break;
          }
        }
        return containers;
      },
    });
  },
});
