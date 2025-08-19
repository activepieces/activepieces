import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { smartsheetAuth } from '../../index';
import { smartsheetCommon } from '../common';

export const findSheetByName = createAction({
  auth: smartsheetAuth,
  name: 'find_sheet_by_name',
  displayName: 'Find Sheet(s)',
  description: 'Fetches existings sheets matching provided filter criteria.',
  props: {
    // Search options
    sheet_name: Property.ShortText({
      displayName: 'Sheet Name Filter',
      description: 'Filter sheets by name (partial or exact match). Leave empty to list all sheets.',
      required: false,
    }),

    exact_match: Property.Checkbox({
      displayName: 'Exact Name Match',
      description: 'When filtering by name, require exact match instead of partial match',
      required: false,
      defaultValue: false,
    }),

    // Pagination options
    include_all: Property.Checkbox({
      displayName: 'Include All Results',
      description: 'If true, include all results without pagination (overrides page and page size)',
      required: false,
      defaultValue: false,
    }),

    page: Property.Number({
      displayName: 'Page Number',
      description: 'Which page to return (defaults to 1, ignored if "Include All Results" is true)',
      required: false,
      defaultValue: 1,
    }),

    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Maximum number of items to return per page (defaults to 100, max 10000, ignored if "Include All Results" is true)',
      required: false,
      defaultValue: 100,
    }),

    // Access and filtering options
    access_api_level: Property.StaticDropdown({
      displayName: 'Access API Level',
      description: 'API access level for viewing and filtering permissions',
      required: false,
      defaultValue: '0',
      options: {
        options: [
          { label: 'Viewer (default)', value: '0' },
          { label: 'Commenter', value: '1' },
        ],
      },
    }),

    access_level_filter: Property.StaticMultiSelectDropdown({
      displayName: 'Filter by Access Level',
      description: 'Only return sheets where you have specific access levels (leave empty for all)',
      required: false,
      options: {
        options: [
          { label: 'Owner', value: 'OWNER' },
          { label: 'Admin', value: 'ADMIN' },
          { label: 'Editor (with sharing)', value: 'EDITOR_SHARE' },
          { label: 'Editor', value: 'EDITOR' },
          { label: 'Commenter', value: 'COMMENTER' },
          { label: 'Viewer', value: 'VIEWER' },
        ],
      },
    }),

    modified_since: Property.DateTime({
      displayName: 'Modified Since',
      description: 'Only return sheets modified on or after this date/time',
      required: false,
    }),

    // Additional data options
    include_sheet_version: Property.Checkbox({
      displayName: 'Include Sheet Version',
      description: 'Include current version number of each sheet',
      required: false,
      defaultValue: false,
    }),

    include_source_info: Property.Checkbox({
      displayName: 'Include Source Information',
      description: 'Include information about the source (template/sheet) each sheet was created from',
      required: false,
      defaultValue: false,
    }),

    numeric_dates: Property.Checkbox({
      displayName: 'Numeric Dates',
      description: 'Return dates as milliseconds since UNIX epoch instead of ISO strings',
      required: false,
      defaultValue: false,
    }),

    // Advanced filtering
    created_date_range: Property.StaticDropdown({
      displayName: 'Created Date Range',
      description: 'Filter sheets by creation date range',
      required: false,
      options: {
        options: [
          { label: 'All time', value: 'all' },
          { label: 'Last 7 days', value: 'week' },
          { label: 'Last 30 days', value: 'month' },
          { label: 'Last 90 days', value: 'quarter' },
          { label: 'Last 365 days', value: 'year' },
        ],
      },
    }),

    sort_by: Property.StaticDropdown({
      displayName: 'Sort Results By',
      description: 'How to sort the returned sheets',
      required: false,
      defaultValue: 'name',
      options: {
        options: [
          { label: 'Sheet Name', value: 'name' },
          { label: 'Creation Date (newest first)', value: 'created_desc' },
          { label: 'Creation Date (oldest first)', value: 'created_asc' },
          { label: 'Modified Date (newest first)', value: 'modified_desc' },
          { label: 'Modified Date (oldest first)', value: 'modified_asc' },
          { label: 'Access Level', value: 'access' },
        ],
      },
    }),
  },

  async run(context) {
    const {
      sheet_name,
      exact_match,
      include_all,
      page,
      page_size,
      access_api_level,
      access_level_filter,
      modified_since,
      include_sheet_version,
      include_source_info,
      numeric_dates,
      created_date_range,
      sort_by,
    } = context.propsValue;

    // Build query parameters
    const queryParams: any = {};

    // Pagination
    if (include_all) {
      queryParams.includeAll = true;
    } else {
      if (page && page > 1) {
        queryParams.page = page;
      }
      if (page_size && page_size !== 100) {
        queryParams.pageSize = Math.min(page_size, 10000); // Cap at API limit
      }
    }

    // Access level
    if (access_api_level && access_api_level !== '0') {
      queryParams.accessApiLevel = parseInt(access_api_level as string);
    }

    // Modified since filter
    if (modified_since) {
      queryParams.modifiedSince = new Date(modified_since as string).toISOString();
    }

    // Include options
    const includeOptions: string[] = [];
    if (include_sheet_version) {
      includeOptions.push('sheetVersion');
    }
    if (include_source_info) {
      includeOptions.push('source');
    }
    if (includeOptions.length > 0) {
      queryParams.include = includeOptions.join(',');
    }

    // Numeric dates
    if (numeric_dates) {
      queryParams.numericDates = true;
    }

    const apiUrl = `${smartsheetCommon.baseUrl}/sheets`;

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
      const sheetData = response.body;

      // Apply client-side filters
      let filteredSheets = sheetData.data || [];

      // Filter by sheet name if specified
      if (sheet_name) {
        const searchName = (sheet_name as string).toLowerCase();
        filteredSheets = filteredSheets.filter((sheet: any) => {
          const sheetName = sheet.name.toLowerCase();
          return exact_match ?
            sheetName === searchName :
            sheetName.includes(searchName);
        });
      }

      // Filter by access level
      if (access_level_filter && access_level_filter.length > 0) {
        filteredSheets = filteredSheets.filter((sheet: any) =>
          access_level_filter.includes(sheet.accessLevel)
        );
      }

      // Filter by creation date range
      if (created_date_range && created_date_range !== 'all') {
        const now = new Date();
        const cutoffDate = new Date();

        switch (created_date_range) {
          case 'week': {
            cutoffDate.setDate(now.getDate() - 7);
            break;
          }
          case 'month': {
            cutoffDate.setDate(now.getDate() - 30);
            break;
          }
          case 'quarter': {
            cutoffDate.setDate(now.getDate() - 90);
            break;
          }
          case 'year': {
            cutoffDate.setDate(now.getDate() - 365);
            break;
          }
        }

        filteredSheets = filteredSheets.filter((sheet: any) => {
          const createdDate = new Date(sheet.createdAt);
          return createdDate >= cutoffDate;
        });
      }

      // Sort results
      if (sort_by) {
        filteredSheets.sort((a: any, b: any) => {
          switch (sort_by) {
            case 'name':
              return a.name.localeCompare(b.name);
            case 'created_desc':
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case 'created_asc':
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case 'modified_desc':
              return new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime();
            case 'modified_asc':
              return new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
            case 'access': {
              const accessOrder = ['OWNER', 'ADMIN', 'EDITOR_SHARE', 'EDITOR', 'COMMENTER', 'VIEWER'];
              return accessOrder.indexOf(a.accessLevel) - accessOrder.indexOf(b.accessLevel);
            }
            default:
              return 0;
          }
        });
      }

      // Organize sheets by access level for analysis
      const sheetsByAccess: any = {};
      const sheetsBySource: any = {};

      filteredSheets.forEach((sheet: any) => {
        // Group by access level
        if (!sheetsByAccess[sheet.accessLevel]) {
          sheetsByAccess[sheet.accessLevel] = [];
        }
        sheetsByAccess[sheet.accessLevel].push(sheet);

        // Group by source type (if source info is included)
        if (sheet.source) {
          const sourceType = sheet.source.type || 'unknown';
          if (!sheetsBySource[sourceType]) {
            sheetsBySource[sourceType] = [];
          }
          sheetsBySource[sourceType].push(sheet);
        }
      });

      // Calculate date-based statistics
      const now = new Date();
      const recentlyModified = filteredSheets.filter((sheet: any) => {
        const modifiedDate = new Date(sheet.modifiedAt);
        const daysDiff = (now.getTime() - modifiedDate.getTime()) / (1000 * 3600 * 24);
        return daysDiff <= 7;
      }).length;

      const recentlyCreated = filteredSheets.filter((sheet: any) => {
        const createdDate = new Date(sheet.createdAt);
        const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
        return daysDiff <= 7;
      }).length;

      return {
        success: true,

        // Pagination info
        pagination: {
          page_number: sheetData.pageNumber,
          page_size: sheetData.pageSize,
          total_pages: sheetData.totalPages,
          total_count: sheetData.totalCount,
          filtered_count: filteredSheets.length,
        },

        // Main results
        sheets: filteredSheets,

        // Organized results
        sheets_by_access_level: sheetsByAccess,
        sheets_by_source_type: sheetsBySource,

        // Summary statistics
        summary: {
          total_sheets: filteredSheets.length,
          owned_sheets: (sheetsByAccess.OWNER || []).length,
          admin_sheets: (sheetsByAccess.ADMIN || []).length,
          editor_sheets: ((sheetsByAccess.EDITOR || []).length + (sheetsByAccess.EDITOR_SHARE || []).length),
          commenter_sheets: (sheetsByAccess.COMMENTER || []).length,
          viewer_sheets: (sheetsByAccess.VIEWER || []).length,
          recently_modified: recentlyModified,
          recently_created: recentlyCreated,
          sheets_with_source: Object.values(sheetsBySource).flat().length,
        },

        // Access level breakdown
        access_breakdown: Object.keys(sheetsByAccess).map(level => ({
          access_level: level,
          count: sheetsByAccess[level].length,
          percentage: Math.round((sheetsByAccess[level].length / filteredSheets.length) * 100),
        })),

        // Applied filters info
        filters_applied: {
          name_filter: sheet_name || null,
          exact_match: exact_match,
          access_levels: access_level_filter || [],
          modified_since: modified_since || null,
          created_date_range: created_date_range || 'all',
          sort_by: sort_by || 'name',
        },

        // API options used
        api_options: {
          access_api_level: access_api_level,
          include_sheet_version: include_sheet_version,
          include_source_info: include_source_info,
          numeric_dates: numeric_dates,
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
