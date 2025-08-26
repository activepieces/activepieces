import { createAction, Property } from '@activepieces/pieces-framework';
import { createPineconeClientFromAuth } from '../common/pinecone-client';
import { pineconeAuth } from '../../index';

export const deleteVector = createAction({
  auth: pineconeAuth,
  name: 'delete_vector',
  displayName: 'Delete Vector',
  description:
    'Delete vectors by id from a single namespace. You can delete one record, multiple records, or all records in a namespace.',
  props: {
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the index to delete vectors from',
      required: true
    }),
    indexHost: Property.ShortText({
      displayName: 'Index Host',
      description:
        'The unique host for the index (optional, see Pinecone docs for targeting an index)',
      required: false
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description:
        'The namespace to delete vectors from (e.g., "example-namespace")',
      required: false,
      defaultValue: 'example-namespace'
    }),
    deleteMode: Property.StaticDropdown({
      displayName: 'Delete Mode',
      description: 'Choose how to delete vectors',
      required: true,
      options: {
        options: [
          { label: 'Delete One Vector', value: 'one' },
          { label: 'Delete Multiple Vectors', value: 'many' },
          { label: 'Delete All Vectors', value: 'all' },
          { label: 'Delete by Filter', value: 'filter' }
        ]
      },
      defaultValue: 'one'
    }),
    // Single vector deletion
    id: Property.ShortText({
      displayName: 'Vector ID',
      description:
        'The ID of the vector to delete (for single vector deletion)',
      required: false
    }),
    // Multiple vector deletion
    ids: Property.Array({
      displayName: 'Vector IDs',
      description: 'Array of vector IDs to delete (e.g., ["id-2", "id-3"])',
      required: false
    }),
    // Delete all confirmation
    confirmDeleteAll: Property.Checkbox({
      displayName: 'Confirm Delete All',
      description:
        'Check this box to confirm you want to delete ALL vectors in the namespace',
      required: false,
      defaultValue: false
    }),
    // Filter-based deletion
    filter: Property.Json({
      displayName: 'Metadata Filter',
      description:
        'Metadata filter to select vectors to delete (mutually exclusive with IDs or delete all)',
      required: false
    })
  },
  async run(context) {
    const {
      indexName,
      indexHost,
      namespace,
      deleteMode,
      id,
      ids,
      confirmDeleteAll,
      filter
    } = context.propsValue;

    // Validation following SDK pattern
    if (!indexName) {
      throw new Error('You must provide an index name to delete vectors.');
    }

    // Initialize Pinecone client following SDK documentation
    const pc = createPineconeClientFromAuth(context.auth);

    try {
      // Target the index following SDK pattern
      // const index = pc.index("INDEX_NAME", "INDEX_HOST")
      const index = indexHost
        ? pc.index(indexName, indexHost)
        : pc.index(indexName);

      // Get namespace reference following SDK pattern
      // const ns = index.namespace('example-namespace')
      const ns = namespace ? index.namespace(namespace) : index;

      let deleteResult: any;
      let deletedCount = 0;
      let operation = '';

      if (deleteMode === 'one') {
        // Delete one record by ID following SDK pattern
        // await ns.deleteOne('id-1');
        if (!id) {
          throw new Error(
            'You must provide a vector ID for single vector deletion.'
          );
        }

        await ns.deleteOne(id);
        deletedCount = 1;
        operation = `Deleted vector with ID: ${id}`;
      } else if (deleteMode === 'many') {
        // Delete more than one record by ID following SDK pattern
        // await ns.deleteMany(['id-2', 'id-3']);
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
          throw new Error(
            'You must provide an array of vector IDs for multiple vector deletion.'
          );
        }

        await ns.deleteMany(ids as string[]);
        deletedCount = ids.length;
        operation = `Deleted ${ids.length} vectors with IDs: ${(
          ids as string[]
        ).join(', ')}`;
      } else if (deleteMode === 'all') {
        // Delete all vectors in namespace
        if (!confirmDeleteAll) {
          throw new Error(
            'You must confirm deletion by checking "Confirm Delete All" to delete all vectors in the namespace.'
          );
        }

        // Use the deleteAll method to delete all vectors
        deleteResult = await ns.deleteAll();
        operation = `Deleted ALL vectors in namespace: ${
          namespace || 'default'
        }`;
      } else if (deleteMode === 'filter') {
        // Delete by metadata filter
        if (!filter) {
          throw new Error(
            'You must provide a metadata filter for filter-based deletion.'
          );
        }

        // For filter-based deletion, we need to use a different approach
        // This might require querying first and then deleting the results
        throw new Error(
          'Filter-based deletion is not directly supported by the current Pinecone SDK. Please use query + deleteMany approach.'
        );
      }

      return {
        success: true,
        indexName: indexName,
        namespace: namespace || 'default',
        deleteMode: deleteMode,
        operation: operation,
        ...(deletedCount > 0 && { deletedCount }),
        ...(deleteResult && { deleteResult }),
        message: `Successfully completed delete operation: ${operation}`
      };
    } catch (caught) {
      console.log('Failed to delete vector(s).', caught);
      return caught;
    }
  }
});
