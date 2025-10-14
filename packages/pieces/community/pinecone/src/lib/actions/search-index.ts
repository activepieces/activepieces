import { createAction, Property } from '@activepieces/pieces-framework';
import { createPineconeClientFromAuth } from '../common/pinecone-client';
import { pineconeAuth } from '../../index';

export const searchIndex = createAction({
  auth: pineconeAuth,
  name: 'search_index',
  displayName: 'Search Index',
  description: 'Search indexes by name or list all indexes in your project.',
  props: {
    searchMode: Property.StaticDropdown({
      displayName: 'Search Mode',
      description: 'Choose how to search for indexes',
      required: true,
      options: {
        options: [
          { label: 'List All Indexes', value: 'list' },
          { label: 'Find Specific Index', value: 'find' }
        ]
      },
      defaultValue: 'list'
    }),
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the specific index to search for (when using Find Specific Index mode)',
      required: false
    }),
    nameFilter: Property.ShortText({
      displayName: 'Name Filter',
      description: 'Filter indexes by name (partial match, case-insensitive)',
      required: false
    })
  },
  async run(context) {
    const { searchMode, indexName, nameFilter } = context.propsValue;

    if (searchMode === 'find' && !indexName) {
      throw new Error('You must provide an index name when using Find Specific Index mode.');
    }

    const pc = createPineconeClientFromAuth(context.auth);

    try {
      if (searchMode === 'find') {
        const indexDetails = await pc.describeIndex(indexName!);
        
        return {
          success: true,
          mode: 'find',
          searchTerm: indexName,
          found: true,
          index: indexDetails,
          message: `Successfully found index: ${indexName}`
        };
      } else {
        const indexList = await pc.listIndexes();
        const allIndexes = indexList.indexes || [];

        let filteredIndexes = allIndexes;
        if (nameFilter) {
          const filter = nameFilter.toLowerCase();
          filteredIndexes = allIndexes.filter(index => 
            index.name.toLowerCase().includes(filter)
          );
        }

        return {
          success: true,
          mode: 'list',
          ...(nameFilter && { filter: nameFilter }),
          indexes: filteredIndexes,
          totalCount: allIndexes.length,
          filteredCount: filteredIndexes.length,
          summary: {
            total: allIndexes.length,
            returned: filteredIndexes.length,
            ...(nameFilter && { filtered: true })
          },
          message: nameFilter 
            ? `Found ${filteredIndexes.length} indexes matching "${nameFilter}" out of ${allIndexes.length} total`
            : `Successfully listed ${allIndexes.length} indexes`
        };
      }
    } catch (caught) {
      console.log('Failed to search indexes.', caught);

      if (caught instanceof Error) {
        const error = caught as any;

        if (error.status === 404 || error.code === 404) {
          if (searchMode === 'find') {
            return {
              success: false,
              mode: 'find',
              searchTerm: indexName,
              found: false,
              error: 'Index Not Found',
              code: 404,
              message: `Index "${indexName}" does not exist in your project.`
            };
          }
        }

        if (error.status === 400 || error.code === 400) {
          return {
            success: false,
            error: 'Bad Request',
            code: 400,
            message: error.message || 'The request included invalid parameters.',
            details: error.details || []
          };
        }

        if (error.status === 403 || error.code === 403) {
          return {
            success: false,
            error: 'Permission Denied',
            code: 403,
            message: 'You do not have permission to access indexes in this project.',
            details: error.details || []
          };
        }

        if (error.status >= 500 || error.code >= 500) {
          return {
            success: false,
            error: 'Server Error',
            code: error.status || error.code,
            message: error.message || 'An unexpected server error occurred.',
            details: error.details || []
          };
        }
      }

      return {
        success: false,
        error: 'Unknown Error',
        message: caught instanceof Error 
          ? caught.message 
          : 'An unexpected error occurred while searching indexes.'
      };
    }
  }
});
