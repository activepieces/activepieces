import { createAction, Property } from '@activepieces/pieces-framework';
import { pineconeApi } from '../common/api';
import { pineconeAuth } from '../auth';
import { searchIndexOutputSchema } from '../output-schemas';

export const searchIndexAction = createAction({
  auth: pineconeAuth,
  name: 'search_index',
  outputSchema: searchIndexOutputSchema,
  classification: 'SEARCH',
  displayName: 'Search Index',
  description: 'Search indexes by name or list all indexes in your project.',
  audience: 'human',
  aiMetadata: { description: 'Discovers indexes in the connected Pinecone project, operating in one of two modes: list all indexes (optionally narrowed by a case-insensitive partial name filter) or describe one specific index by its exact name. Use to enumerate available indexes or confirm an index exists and inspect its configuration before other operations. Idempotent read-only lookup.', idempotent: true },
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

    try {
      if (searchMode === 'find' && indexName) {
        const indexDetails = await pineconeApi.describeLegacyIndex({ auth: context.auth, indexName });
        
        return {
          success: true,
          mode: 'find',
          searchTerm: indexName,
          found: true,
          index: indexDetails,
          message: `Successfully found index: ${indexName}`
        };
      } else {
        const indexList = await pineconeApi.listLegacyIndexes({ auth: context.auth });
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
