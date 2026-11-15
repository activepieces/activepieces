import { createAction, Property } from '@activepieces/pieces-framework';

import { algoliaAuth } from '../common/auth';
import { listAlgoliaIndices } from '../common/client';
import { algoliaOutputSchemas } from '../common/output-schemas';
import { parseIntegerInRange } from '../common/utils';

export const listIndicesAction = createAction({
  auth: algoliaAuth,
  name: 'list_indices',
  classification: 'READ',
  displayName: 'List Indices',
  description: 'Lists the indices in your Algolia application.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists the indices in the connected Algolia application with their record count, data size in bytes, last update time, and primary/replica links. Use this first to find the exact index name to pass to the other Algolia tools. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: algoliaOutputSchemas.listIndices,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of indices to return (1-10000). Defaults to 100.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const limit = parseIntegerInRange({
      value: context.propsValue.limit,
      fieldName: 'Limit',
      min: 1,
      max: 10_000,
      defaultValue: 100,
    });
    const indices = await listAlgoliaIndices({ auth: context.auth, limit });

    return {
      indices: indices.map((index) => ({
        name: index.name,
        entries: index.entries,
        dataSize: index.dataSize,
        updatedAt: index.updatedAt,
        ...(index.primary ? { primary: index.primary } : {}),
        ...(index.replicas ? { replicas: index.replicas } : {}),
      })),
      count: indices.length,
    };
  },
});
