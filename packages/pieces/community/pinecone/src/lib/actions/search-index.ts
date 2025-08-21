import { createAction, Property } from '@activepieces/pieces-framework';
import { pineconeAuth, PineconeAuth } from '../common/auth';
import { PineconeClient } from '../common/client';

interface PineconeIndex {
  name: string;
  [key: string]: unknown;
}

interface IndexWithStats extends PineconeIndex {
  stats?: unknown;
  statsError?: string;
}

interface ErrorResponse {
  response?: {
    status: number;
    body: unknown;
  };
  message?: string;
}

export const searchIndex = createAction({
  name: 'search-index',
  displayName: 'Search Index',
  description: 'Searches for Pinecone indexes by name',
  auth: pineconeAuth,
  props: {
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the index to search for (partial match supported)',
      required: true,
    }),
    includeStats: Property.Checkbox({
      displayName: 'Include Statistics',
      description: 'Whether to include index statistics in the response',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { indexName, includeStats = false } = propsValue;
    const { apiKey, projectId } = auth as PineconeAuth;

    // Validate required auth parameters
    if (!apiKey || !projectId) {
      throw new Error('API Key and Project ID are required for authentication');
    }

    try {
      const client = new PineconeClient(auth);
      
      const response = await client.getAllIndexes();
      
      let allIndexes: PineconeIndex[] = [];
      
      if (Array.isArray(response)) {
        allIndexes = response;
      } else if (response && typeof response === 'object') {
        // Handle case where response might be wrapped in an object
        if (Array.isArray(response.indexes)) {
          allIndexes = response.indexes;
        } else if (Array.isArray(response.data)) {
          allIndexes = response.data;
        } else if (Array.isArray(response.results)) {
          allIndexes = response.results;
        } else {
          throw new Error(`Unexpected response structure from Pinecone API. Expected array of indexes. Response keys: ${Object.keys(response).join(', ')}`);
        }
      } else {
        throw new Error(`Invalid response format from Pinecone API. Expected array, got: ${typeof response}`);
      }
      
      const matchingIndexes = allIndexes.filter(index => 
        index.name && index.name.toLowerCase().includes(indexName.toLowerCase())
      );

      if (matchingIndexes.length === 0) {
        return {
          success: true,
          message: `No indexes found matching "${indexName}"`,
          indexes: [],
          count: 0
        };
      }
      let detailedIndexes: IndexWithStats[] = matchingIndexes;
      
      if (includeStats) {
        const detailedPromises = matchingIndexes.map(async (index) => {
          try {
            // Use the client to get index stats
            const indexInfo = await client.getIndex(index.name);
            const host = indexInfo.host;
            
            if (host) {
              const statsResponse = await client.describeIndexStats(host);
              return {
                ...index,
                stats: statsResponse
              };
            } else {
              return {
                ...index,
                stats: null,
                statsError: 'Index host not found'
              };
            }
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
              ...index,
              stats: null,
              statsError: `Error fetching stats: ${errorMessage}`
            };
          }
        });

        detailedIndexes = await Promise.all(detailedPromises);
      }

      return {
        success: true,
        message: `Found ${matchingIndexes.length} index(es) matching "${indexName}"`,
        indexes: detailedIndexes,
        count: matchingIndexes.length,
        searchTerm: indexName
      };

    } catch (error: unknown) {
      // Provide more specific error information
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('Authentication failed')) {
        throw error;
      }
      
      let finalErrorMessage = 'Unknown error occurred';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const errorResponse = error as ErrorResponse;
        if (errorResponse.response) {
          finalErrorMessage = `API Error: ${errorResponse.response.status} - ${JSON.stringify(errorResponse.response.body)}`;
        }
      } else if (errorMessage) {
        finalErrorMessage = errorMessage;
      }
        
      throw new Error(`Failed to search indexes: ${finalErrorMessage}`);
    }
  },
});
