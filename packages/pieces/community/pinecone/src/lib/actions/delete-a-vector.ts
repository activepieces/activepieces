import { createAction, Property } from '@activepieces/pieces-framework';
import { pineconeAuth } from '../common/auth';
import { PineconeClient } from '../common/client';
import { commonProps } from '../common/props';

interface DeleteVectorRequestBody {
  ids?: string[];
  deleteAll?: boolean;
  filter?: Record<string, unknown>;
  namespace?: string;
}

interface ErrorResponse {
  response?: {
    status: number;
    body: unknown;
  };
  message?: string;
}

export const deleteAVector = createAction({
  name: 'delete-a-vector',
  displayName: 'Delete Vectors',
  description: 'Delete vectors by ID from a single namespace. Supports deleting specific vectors, all vectors, or vectors matching metadata filters.',
  auth: pineconeAuth,
  props: {
    indexName: commonProps.indexName,
    namespace: commonProps.namespace,
    deleteMethod: Property.Dropdown({
      displayName: 'Delete Method',
      description: 'Choose how to delete vectors',
      required: true,
      defaultValue: 'specific_ids',
      refreshers: [],
      options: async () => {
        return {
          disabled: false,
          options: [
            { label: 'Delete Specific Vector IDs', value: 'specific_ids' },
            { label: 'Delete All Vectors', value: 'delete_all' },
            { label: 'Delete by Metadata Filter', value: 'filter' }
          ]
        };
      }
    }),
    vectorIds: Property.Json({
      displayName: 'Vector IDs',
      description: 'Array of vector IDs to delete (required when deleting specific IDs)',
      required: false,
      defaultValue: ['id-0', 'id-1']
    }),

    metadataFilter: Property.Json({
      displayName: 'Metadata Filter',
      description: 'Metadata filter to select vectors for deletion (required when using filter method). See Pinecone documentation for filter syntax.',
      required: false,
      defaultValue: {
        genre: { $eq: "comedy" },
        year: { $gte: 2020 }
      }
    }),
    
    confirmDeleteAll: Property.Checkbox({
      displayName: 'Confirm Delete All',
      description: 'Check this to confirm you want to delete ALL vectors (required when using delete all method)',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { 
      indexName, 
      namespace, 
      deleteMethod, 
      vectorIds, 
      metadataFilter, 
      confirmDeleteAll 
    } = propsValue;

  
    if (deleteMethod === 'specific_ids') {
      if (!vectorIds || !Array.isArray(vectorIds)) {
        throw new Error('Vector IDs array is required when deleting specific vectors');
      }
      if (vectorIds.length === 0) {
        throw new Error('Vector IDs array cannot be empty');
      }
      if (vectorIds.length > 1000) {
        throw new Error('Maximum 1000 vector IDs allowed per delete operation');
      }
      
     
      for (let i = 0; i < vectorIds.length; i++) {
        const id = vectorIds[i];
        if (!id || typeof id !== 'string') {
          throw new Error(`Vector ID at index ${i} must be a valid string`);
        }
        if (id.trim().length === 0) {
          throw new Error(`Vector ID at index ${i} cannot be empty or whitespace`);
        }
      }
    }

    if (deleteMethod === 'delete_all') {
      if (!confirmDeleteAll) {
        throw new Error('You must confirm the delete all operation by checking the confirmation checkbox');
      }
    }

    if (deleteMethod === 'filter') {
      if (!metadataFilter || typeof metadataFilter !== 'object' || metadataFilter === null) {
        throw new Error('Metadata filter is required when using filter method');
      }
    }

    try {
      const client = new PineconeClient(auth);
      
     
      const indexInfo = await client.getIndex(indexName);
      const host = indexInfo.host;

      if (!host) {
        throw new Error('Index host not found in response');
      }

    
      if (deleteMethod === 'specific_ids' && vectorIds && Array.isArray(vectorIds) && vectorIds.length > 0) {
        try {
          
          const idsToCheck = Array.isArray(vectorIds) ? vectorIds.slice(0, Math.min(10, vectorIds.length)) : [];
          const fetchResponse = await client.fetchVector(host, { 
            ids: idsToCheck,
            namespace 
          });
          
          if (fetchResponse.vectors && Object.keys(fetchResponse.vectors).length === 0) {
            // Warning: No vectors found with the provided IDs. The delete operation may not affect any vectors.
          }
        } catch (fetchError: unknown) {
          // Warning: Could not verify vector existence before deletion. Continue with deletion even if verification fails.
        }
      }

      // Build the request body
      const requestBody: DeleteVectorRequestBody = {};

      if (deleteMethod === 'specific_ids') {
        requestBody.ids = vectorIds as unknown as string[];
      } else if (deleteMethod === 'delete_all') {
        requestBody.deleteAll = true;
      } else if (deleteMethod === 'filter') {
        if (metadataFilter && typeof metadataFilter === 'object' && metadataFilter !== null) {
          requestBody.filter = metadataFilter as Record<string, unknown>;
        }
      }

      // Add namespace if provided
      if (namespace) {
        requestBody.namespace = namespace;
      }

      const deleteResult = await client.deleteVectors(host, requestBody);


      let message = '';
      if (deleteMethod === 'specific_ids') {
        message = `Successfully deleted ${Array.isArray(vectorIds) ? vectorIds.length : 0} vector(s) from index "${indexName}"`;
      } else if (deleteMethod === 'delete_all') {
        message = `Successfully deleted ALL vectors from index "${indexName}"`;
      } else if (deleteMethod === 'filter') {
        message = `Successfully deleted vectors matching filter from index "${indexName}"`;
      }

      if (namespace) {
        message += ` in namespace "${namespace}"`;
      }

      return {
        success: true,
        message,
        indexName,
        namespace: namespace || null,
        deleteMethod,
        requestBody,
        response: deleteResult,
        summary: {
          method: deleteMethod,
          vectorIds: deleteMethod === 'specific_ids' ? vectorIds : null,
          metadataFilter: deleteMethod === 'filter' ? metadataFilter : null,
          deleteAll: deleteMethod === 'delete_all'
        }
      };

    } catch (error: unknown) {
      // Handle error response
      let errorMessage = 'Failed to delete vectors';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const errorResponse = error as ErrorResponse;
        if (errorResponse.response) {
          const { status, body } = errorResponse.response;
          errorMessage += `: HTTP ${status}`;
          
          if (body) {
            if (typeof body === 'object' && body !== null) {
              if ('message' in body && typeof body.message === 'string') {
                errorMessage += ` - ${body.message}`;
              } else if ('error' in body && typeof body.error === 'string') {
                errorMessage += ` - ${body.error}`;
              } else {
                errorMessage += ` - ${JSON.stringify(body)}`;
              }
            } else {
              errorMessage += ` - ${String(body)}`;
            }
          }
        }
      } else if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      
      // Re-throw with enhanced error message
      throw new Error(errorMessage);
    }
  },
});
