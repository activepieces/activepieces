import { createAction, Property } from '@activepieces/pieces-framework';
import { pineconeClient } from '../common/client';
import { pineconeAuth } from '../auth';
import { getVectorOutputSchema } from '../output-schemas';

export const getVectorAction = createAction({
  auth: pineconeAuth,
  name: 'get_vector',
  outputSchema: getVectorOutputSchema,
  classification: 'READ',
  displayName: 'Get a Vector',
  description: 'Look up and return vectors by ID from a namespace.',
  audience: 'human',
  aiMetadata: { description: 'Fetches one or more stored vectors by their exact IDs from a namespace of a Pinecone index. Use when you already know the vector IDs and want their values and metadata; for similarity lookups use Search Vectors instead. Requires the index name and at least one ID (IDs cannot contain spaces). Idempotent read-only lookup.', idempotent: true },
  props: {
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the index to fetch vectors from',
      required: true,
    }),
    indexHost: Property.ShortText({
      displayName: 'Index Host',
      description: 'The unique host for the index (optional, see Pinecone docs for targeting an index)',
      required: false,
    }),
    ids: Property.Array({
      displayName: 'Vector IDs',
      description: 'The vector IDs to fetch. Does not accept values containing spaces (e.g., ["id-1", "id-2"])',
      required: true,
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'The namespace containing the vectors to fetch (e.g., "example-namespace")',
      required: false,
      defaultValue: 'example-namespace',
    }),

  },
  async run(context) {
    const {
      indexName,
      indexHost,
      ids,
      namespace,
    } = context.propsValue;

    if (!indexName) {
      throw new Error('You must provide an index name to fetch vectors.');
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new Error('You must provide at least one vector ID to fetch.');
    }

    const invalidIds = ids.filter((id) => typeof id === 'string' && id.includes(' '));
    if (invalidIds.length > 0) {
      throw new Error(`Vector IDs cannot contain spaces. Invalid IDs: ${invalidIds.join(', ')}`);
    }

    const recordIds = ids.map((id) => String(id));

    const pc = pineconeClient.create({ auth: context.auth });

    try {

      const index = indexHost ? pc.index({ name: indexName, host: indexHost }) : pc.index({ name: indexName });


      const fetchResult = namespace 
        ? await index.namespace(namespace).fetch({ ids: recordIds })
        : await index.fetch({ ids: recordIds });

      const records = fetchResult.records || {};
      const vectorCount = Object.keys(records).length;
      const foundIds = Object.keys(records);
      const notFoundIds = recordIds.filter(id => !foundIds.includes(id));

      return {
        success: true,
        indexName: indexName,
        namespace: fetchResult.namespace,
        usage: fetchResult.usage,
        vectors: records,
        summary: {
          requested: ids.length,
          found: vectorCount,
          foundIds: foundIds,
          ...(notFoundIds.length > 0 && { notFoundIds: notFoundIds }),
        },
        message: `Successfully fetched ${vectorCount} out of ${ids.length} requested vector(s)`,
      };
    } catch (caught) {
      return {
        success: false,
        error: 'Unknown Error',
        message: caught instanceof Error ? caught.message : 'An unexpected error occurred while fetching vectors.',
        requestedIds: ids,
        indexName: indexName,
        namespace: namespace || 'default',
      };
    }
  },
});