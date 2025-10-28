import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { smartsheetAuth } from '../../index';
import { smartsheetCommon } from '../common';

export const findRowsByQuery = createAction({
  auth: smartsheetAuth,
  name: 'find_rows_by_query',
  displayName: 'Find Row',
  description: 'Finds rows in a specific sheet or across all accessible sheets using text queries with advanced filtering options.',
  props: {
    search_scope: Property.StaticDropdown({
      displayName: 'Search Scope',
      description: 'Choose whether to search within a specific sheet or across all accessible sheets.',
      required: true,
      defaultValue: 'specific_sheet',
      options: {
        options: [
          { label: 'Specific Sheet', value: 'specific_sheet' },
          { label: 'All Accessible Sheets', value: 'all_sheets' },
        ],
      },
    }),

    sheet_id: smartsheetCommon.sheet_id(false),

    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Text to search for. Use double quotes for exact phrase matching (e.g., "project status")',
      required: true,
    }),

    // Advanced search options
    search_scopes: Property.StaticMultiSelectDropdown({
      displayName: 'Search Scopes',
      description: 'Specify what types of content to search in (leave empty to search all)',
      required: false,
      options: {
        options: [
          { label: 'Cell Data', value: 'cellData' },
          { label: 'Comments', value: 'comments' },
          { label: 'Attachments', value: 'attachments' },
          { label: 'Sheet Names', value: 'sheetNames' },
          { label: 'Folder Names', value: 'folderNames' },
          { label: 'Report Names', value: 'reportNames' },
          { label: 'Dashboard Names', value: 'sightNames' },
          { label: 'Template Names', value: 'templateNames' },
          { label: 'Workspace Names', value: 'workspaceNames' },
          { label: 'Summary Fields', value: 'summaryFields' },
        ],
      },
    }),

    include_favorites: Property.Checkbox({
      displayName: 'Include Favorite Flags',
      description: 'Include information about which items are marked as favorites',
      required: false,
      defaultValue: false,
    }),

    modified_since: Property.DateTime({
      displayName: 'Modified Since',
      description: 'Only return results modified on or after this date/time',
      required: false,
    }),

    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of results to return (default: 50, max: 100)',
      required: false,
      defaultValue: 50,
    }),

    object_types_filter: Property.StaticMultiSelectDropdown({
      displayName: 'Filter by Object Types',
      description: 'Only return results of specific object types (leave empty for all types)',
      required: false,
      options: {
        options: [
          { label: 'Rows', value: 'row' },
          { label: 'Sheets', value: 'sheet' },
          { label: 'Attachments', value: 'attachment' },
          { label: 'Comments/Discussions', value: 'discussion' },
          { label: 'Dashboards', value: 'dashboard' },
          { label: 'Reports', value: 'report' },
          { label: 'Folders', value: 'folder' },
          { label: 'Templates', value: 'template' },
          { label: 'Workspaces', value: 'workspace' },
          { label: 'Summary Fields', value: 'summaryField' },
        ],
      },
    }),
  },

  async run(context) {
    const {
      search_scope,
      sheet_id,
      query,
      search_scopes,
      include_favorites,
      modified_since,
      max_results,
      object_types_filter,
    } = context.propsValue;

    // Validate sheet_id requirement for specific sheet search
    if (search_scope === 'specific_sheet' && !sheet_id) {
      throw new Error('Sheet ID is required when searching within a specific sheet');
    }

    // Build query parameters
    const queryParams: any = {
      query: query,
    };

    // Add search scopes if specified
    if (search_scopes && search_scopes.length > 0) {
      queryParams.scopes = search_scopes;
    }

    // Add include favorites flag
    if (include_favorites) {
      queryParams.include = 'favoriteFlag';
    }

    // Add modified since filter
    if (modified_since) {
      queryParams.modifiedSince = new Date(modified_since as string).toISOString();
    }

    // Determine API endpoint
    let apiUrl: string;
    if (search_scope === 'specific_sheet') {
      apiUrl = `${smartsheetCommon.baseUrl}/search/sheets/${sheet_id}`;
    } else {
      apiUrl = `${smartsheetCommon.baseUrl}/search`;
    }

    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: apiUrl,
        headers: {
          'Authorization': `Bearer ${context.auth}`,
          'Content-Type': 'application/json',
        },
        queryParams,
      };

      const response = await httpClient.sendRequest(request);
      const searchResults = response.body;

      // Filter by object types if specified
      let filteredResults = searchResults.results || [];
      if (object_types_filter && object_types_filter.length > 0) {
        filteredResults = filteredResults.filter((result: any) =>
          object_types_filter.includes(result.objectType)
        );
      }

      // Limit results if specified
      const maxResults = Math.min(max_results || 50, 100);
      if (filteredResults.length > maxResults) {
        filteredResults = filteredResults.slice(0, maxResults);
      }

      // Organize results by type for better usability
      const resultsByType: any = {};
      filteredResults.forEach((result: any) => {
        if (!resultsByType[result.objectType]) {
          resultsByType[result.objectType] = [];
        }
        resultsByType[result.objectType].push(result);
      });

      return {
        success: true,
        total_count: searchResults.totalCount,
        returned_count: filteredResults.length,
        search_query: query,
        search_scope: search_scope,
        results: filteredResults,
        results_by_type: resultsByType,
        sheet_searched: search_scope === 'specific_sheet' ? sheet_id : 'all_accessible_sheets',

        // Summary statistics
        summary: {
          rows_found: (resultsByType.row || []).length,
          sheets_found: (resultsByType.sheet || []).length,
          attachments_found: (resultsByType.attachment || []).length,
          discussions_found: (resultsByType.discussion || []).length,
          other_objects_found: filteredResults.length -
            (resultsByType.row || []).length -
            (resultsByType.sheet || []).length -
            (resultsByType.attachment || []).length -
            (resultsByType.discussion || []).length,
        },
      };
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorBody = error.response.data;
        throw new Error(`Bad Request: ${errorBody.message || 'Invalid request parameters'}`);
      } else if (error.response?.status === 403) {
        throw new Error('Insufficient permissions to access sheets listing');
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      throw new Error(`Failed to retrieve sheets: ${error.message}`);
    }
  },
});
