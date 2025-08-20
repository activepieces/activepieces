import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { pineconeAuth, PineconeAuth } from '../common';

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

    try {
      // First, get all indexes to search through them
      const response = await httpClient.sendRequest({
        url: 'https://api.pinecone.io/indexes',
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: apiKey,
        },
        headers: {
          'x-project-id': projectId,
        },
      });

      if (response.status !== 200) {
        throw new Error(`Failed to fetch indexes: ${response.status}`);
      }

      const allIndexes = response.body as any[];
      
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
            const statsResponse = await httpClient.sendRequest({
              url: `https://api.pinecone.io/indexes/${index.name}/describe_index_stats`,
              method: HttpMethod.POST,
              authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: apiKey,
              },
              headers: {
                'x-project-id': projectId,
              },
              body: {},
            });

            if (statsResponse.status === 200) {
              return {
                ...index,
                stats: statsResponse.body
              };
            } else {
              return {
                ...index,
                stats: null,
                statsError: `Failed to fetch stats: ${statsResponse.status}`
              };
            }
          } catch (error: any) {
            return {
              ...index,
              stats: null,
              statsError: `Error fetching stats: ${error.message}`
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
      throw new Error(`Failed to search indexes: ${error.message || error}`);
    }
  },
});
