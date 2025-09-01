import { createAction, Property } from '@activepieces/pieces-framework';
import { createPineconeClientFromAuth } from '../common/pinecone-client';
import { pineconeAuth } from '../../index';

export const deleteVector = createAction({
  auth: pineconeAuth,
  name: 'delete_vector',
  displayName: 'Delete a Vector',
  description: 'Delete vectors by ID from a namespace.',
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
    id: Property.ShortText({
      displayName: 'Vector ID',
      description:
        'The ID of the vector to delete (for single vector deletion)',
      required: false
    }),
    ids: Property.Array({
      displayName: 'Vector IDs',
      description: 'Array of vector IDs to delete (e.g., ["id-2", "id-3"])',
      required: false
    }),
    confirmDeleteAll: Property.Checkbox({
      displayName: 'Confirm Delete All',
      description:
        'Check this box to confirm you want to delete ALL vectors in the namespace',
      required: false,
      defaultValue: false
    }),
    filter: Property.Json({
      displayName: 'Metadata Filter',
      description: 'Metadata filter expression to select vectors to delete. Examples:\n• {"genre": {"$eq": "documentary"}}\n• {"year": {"$gt": 2019}}\n• {"$and": [{"genre": "comedy"}, {"year": {"$gte": 2020}}]}',
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

    if (!indexName) {
      throw new Error('You must provide an index name to delete vectors.');
    }

    const pc = createPineconeClientFromAuth(context.auth);

    try {

      const index = indexHost
        ? pc.index(indexName, indexHost)
        : pc.index(indexName);


      const ns = namespace ? index.namespace(namespace) : index;

      let deleteResult: any;
      let deletedCount = 0;
      let operation = '';

      if (deleteMode === 'one') {

        if (!id) {
          throw new Error(
            'You must provide a vector ID for single vector deletion.'
          );
        }

        await ns.deleteOne(id);
        deletedCount = 1;
        operation = `Deleted vector with ID: ${id}`;
      } else if (deleteMode === 'many') {

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
        if (!confirmDeleteAll) {
          throw new Error(
            'You must confirm deletion by checking "Confirm Delete All" to delete all vectors in the namespace.'
          );
        }

        deleteResult = await ns.deleteAll();
        operation = `Deleted ALL vectors in namespace: ${
          namespace || 'default'
        }`;
      } else if (deleteMode === 'filter') {

        if (!filter) {
          throw new Error(
            'You must provide a metadata filter for filter-based deletion.'
          );
        }

        await ns.deleteMany(filter);
        operation = `Deleted vectors matching filter: ${JSON.stringify(filter)}`;
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
      
      if (caught instanceof Error) {
        const error = caught as any;
        
        if (error.status === 400 || error.code === 400) {
          return {
            success: false,
            error: 'Bad Request',
            code: 400,
            message: error.message || 'The request body included invalid request parameters.',
            details: error.details || [],
            indexName: indexName,
            namespace: namespace || 'default',
          };
        }
        
        if (error.status >= 400 && error.status < 500) {
          return {
            success: false,
            error: 'Client Error',
            code: error.status || error.code,
            message: error.message || 'An unexpected client error occurred.',
            details: error.details || [],
            indexName: indexName,
            namespace: namespace || 'default',
          };
        }
        
        if (error.status >= 500 || error.code >= 500) {
          return {
            success: false,
            error: 'Server Error',
            code: error.status || error.code,
            message: error.message || 'An unexpected server error occurred.',
            details: error.details || [],
            indexName: indexName,
            namespace: namespace || 'default',
          };
        }
      }
      
      return {
        success: false,
        error: 'Unknown Error',
        message: caught instanceof Error ? caught.message : 'An unexpected error occurred while deleting vectors.',
        indexName: indexName,
        namespace: namespace || 'default',
      };
    }
  }
});
