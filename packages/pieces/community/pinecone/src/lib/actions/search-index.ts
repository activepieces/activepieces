import { createAction, Property } from '@activepieces/pieces-framework';
import { pineconeAuth, PineconeAuth } from '../common';
import { PineconeClient } from '../common/client';

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
      
      // First, get all indexes to search through them
      const response = await client.getAllIndexes();
      
      // Debug: Log the response structure to understand the format
      console.log('Pinecone API Response:', {
        status: '200', // Client handles status internally
        bodyType: typeof response,
        bodyKeys: response && typeof response === 'object' ? Object.keys(response) : 'N/A',
        bodyPreview: response ? JSON.stringify(response).substring(0, 200) + '...' : 'N/A'
      });

      // Ensure response is an array and handle different response formats
      let allIndexes: any[] = [];
      
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
          // Log the actual response structure for debugging
          console.log('Unexpected response structure:', JSON.stringify(response, null, 2));
          throw new Error(`Unexpected response structure from Pinecone API. Expected array of indexes. Response keys: ${Object.keys(response).join(', ')}`);
        }
      } else {
        throw new Error(`Invalid response format from Pinecone API. Expected array, got: ${typeof response}`);
      }
      
      console.log(`Found ${allIndexes.length} total indexes from API`);
      
      // Filter indexes by name (case-insensitive partial match)
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

      // If includeStats is true, fetch detailed information for each matching index
      let detailedIndexes = matchingIndexes;
      
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
          } catch (error: any) {
            return {
              ...index,
              stats: null,
              statsError: `Error fetching stats: ${error.message || error}`
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

    } catch (error: any) {
      // Provide more specific error information
      if (error.message.includes('Authentication failed')) {
        throw error;
      }
      
      const errorMessage = error.response 
        ? `API Error: ${error.response.status} - ${JSON.stringify(error.response.body)}`
        : error.message || 'Unknown error occurred';
        
      throw new Error(`Failed to search indexes: ${errorMessage}`);
    }
  },
});
