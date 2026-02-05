import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wufooApiCall } from '../common/client';
import { wufooAuth } from '../../index';
import { formIdentifier } from '../common/props';

export const getEntryDetailsAction = createAction({
  auth: wufooAuth,
  name: 'get-entry-details',
  displayName: 'Get Entry Details',
  description: 'Get form entries with filtering, sorting, and pagination options.',
  props: {
    formIdentifier: formIdentifier,
    format: Property.StaticDropdown({
      displayName: 'Response Format',
      description: 'Choose the format for the API response. JSON is recommended for most integrations.',
      required: true,
      defaultValue: 'json',
      options: {
        disabled: false,
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'XML', value: 'xml' },
        ],
      },
    }),
    
    entryId: Property.Number({
      displayName: 'Specific Entry ID (Optional)',
      description: 'Enter a specific Entry ID to retrieve just that entry. Leave blank to get multiple entries with other filters.',
      required: false,
    }),
    
    filterField: Property.ShortText({
      displayName: 'Filter Field ID (Optional)',
      description: 'The field ID to filter by (e.g., Field1, Field105, EntryId, DateCreated). Leave blank for no filtering.',
      required: false,
    }),
    
    filterOperator: Property.StaticDropdown({
      displayName: 'Filter Operator',
      description: 'How to compare the filter value with the field data.',
      required: false,
      defaultValue: 'Is_equal_to',
      options: {
        disabled: false,
        options: [
          { label: 'Is Equal To', value: 'Is_equal_to' },
          { label: 'Is Not Equal To', value: 'Is_not_equal_to' },
          { label: 'Contains', value: 'Contains' },
          { label: 'Does Not Contain', value: 'Does_not_contain' },
          { label: 'Begins With', value: 'Begins_with' },
          { label: 'Ends With', value: 'Ends_with' },
          { label: 'Is Greater Than', value: 'Is_greater_than' },
          { label: 'Is Less Than', value: 'Is_less_than' },
          { label: 'Is On (Date)', value: 'Is_on' },
          { label: 'Is Before (Date)', value: 'Is_before' },
          { label: 'Is After (Date)', value: 'Is_after' },
          { label: 'Is Not Empty', value: 'Is_not_NULL' },
        ],
      },
    }),
    
    filterValue: Property.ShortText({
      displayName: 'Filter Value (Optional)',
      description: 'The value to filter by. For dates, use YYYY-MM-DD format or YYYY-MM-DD HH:MM:SS for specific times.',
      required: false,
    }),
    
    additionalFilterField: Property.ShortText({
      displayName: 'Second Filter Field (Optional)',
      description: 'Add a second filter field for more complex queries.',
      required: false,
    }),
    
    additionalFilterOperator: Property.StaticDropdown({
      displayName: 'Second Filter Operator',
      description: 'Operator for the second filter.',
      required: false,
      defaultValue: 'Is_equal_to',
      options: {
        disabled: false,
        options: [
          { label: 'Is Equal To', value: 'Is_equal_to' },
          { label: 'Is Not Equal To', value: 'Is_not_equal_to' },
          { label: 'Contains', value: 'Contains' },
          { label: 'Does Not Contain', value: 'Does_not_contain' },
          { label: 'Begins With', value: 'Begins_with' },
          { label: 'Ends With', value: 'Ends_with' },
          { label: 'Is Greater Than', value: 'Is_greater_than' },
          { label: 'Is Less Than', value: 'Is_less_than' },
          { label: 'Is On (Date)', value: 'Is_on' },
          { label: 'Is Before (Date)', value: 'Is_before' },
          { label: 'Is After (Date)', value: 'Is_after' },
          { label: 'Is Not Empty', value: 'Is_not_NULL' },
        ],
      },
    }),
    
    additionalFilterValue: Property.ShortText({
      displayName: 'Second Filter Value (Optional)',
      description: 'Value for the second filter.',
      required: false,
    }),
    
    filterLogic: Property.StaticDropdown({
      displayName: 'Filter Logic',
      description: 'How to combine multiple filters. Only applies when using multiple filters.',
      required: false,
      defaultValue: 'AND',
      options: {
        disabled: false,
        options: [
          { label: 'AND (All filters must match)', value: 'AND' },
          { label: 'OR (Any filter must match)', value: 'OR' },
        ],
      },
    }),
    
    sort: Property.ShortText({
      displayName: 'Sort By Field ID (Optional)',
      description: 'Sort results by field ID (e.g., EntryId, DateCreated, Field1). Leave blank for default order.',
      required: false,
    }),
    
    sortDirection: Property.StaticDropdown({
      displayName: 'Sort Direction',
      description: 'Order to sort the results.',
      required: false,
      defaultValue: 'DESC',
      options: {
        disabled: false,
        options: [
          { label: 'Descending (Newest first)', value: 'DESC' },
          { label: 'Ascending (Oldest first)', value: 'ASC' },
        ],
      },
    }),
    
    pageStart: Property.Number({
      displayName: 'Page Start',
      description: 'Starting entry number for pagination (0 = first entry).',
      required: false,
      defaultValue: 0,
    }),
    
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Number of entries to return (maximum 100 per request).',
      required: false,
      defaultValue: 25,
    }),
    
    includeSystem: Property.Checkbox({
      displayName: 'Include System Fields',
      description: 'Include additional metadata like IP address, payment status, and completion status.',
      required: false,
      defaultValue: false,
    }),
    

  },
  
  async run(context) {
    const {
      formIdentifier,
      format,
      entryId,
      filterField,
      filterOperator,
      filterValue,
      additionalFilterField,
      additionalFilterOperator,
      additionalFilterValue,
      filterLogic,
      sort,
      sortDirection,
      pageStart,
      pageSize,
      includeSystem,
    } = context.propsValue;

    try {
      const query: Record<string, string> = {
        pageStart: String(pageStart ?? 0),
        pageSize: String(Math.min(pageSize ?? 25, 100)),
        system: includeSystem ? 'true' : 'false',
        pretty: 'false', // Always false to avoid HTML wrapper
      };

      let filterCount = 0;
      
      if (entryId !== undefined && entryId !== null) {
        filterCount++;
        query[`Filter${filterCount}`] = `EntryId+Is_equal_to+${entryId}`;
      } else {
        if (filterField && filterValue) {
          filterCount++;
          query[`Filter${filterCount}`] = `${filterField}+${filterOperator}+${encodeURIComponent(filterValue)}`;
        }
        
        if (additionalFilterField && additionalFilterValue) {
          filterCount++;
          query[`Filter${filterCount}`] = `${additionalFilterField}+${additionalFilterOperator}+${encodeURIComponent(additionalFilterValue)}`;
        }
        
        if (filterCount > 1) {
          query['match'] = filterLogic || 'AND';
        }
      }

      if (sort) {
        query['sort'] = sort;
        if (sortDirection) {
          query['sortDirection'] = sortDirection;
        }
      }

      const response = await wufooApiCall<WufooEntriesResponse | string>({
        method: HttpMethod.GET,
        auth: context.auth,
        resourceUri: `/forms/${formIdentifier}/entries.${format}`,
        query,
      });

      let parsedResponse = response;
      if (typeof response === 'string' && response.includes('OUTPUT =')) {
        const match = response.match(/OUTPUT = ({.*?});/);
        if (match) {
          try {
            parsedResponse = JSON.parse(match[1]);
          } catch (e) {
            parsedResponse = response;
          }
        }
      }

      if (format === 'json' && parsedResponse && typeof parsedResponse === 'object') {
        const entriesData = parsedResponse as WufooEntriesResponse;
        const entries = entriesData.Entries || [];
        
        return {
          success: true,
          message: `Retrieved ${entries.length} entries successfully`,
          summary: {
            totalRetrieved: entries.length,
            pageStart: pageStart ?? 0,
            pageSize: pageSize ?? 25,
            hasMoreEntries: entries.length === (pageSize ?? 25),
            filtersApplied: filterCount,
            sortedBy: sort || 'default',
            sortDirection: sortDirection || 'ASC',
          },
          entries: entries.map(entry => ({
            entryId: entry.EntryId,
            dateCreated: entry.DateCreated,
            dateUpdated: entry.DateUpdated,
            createdBy: entry.CreatedBy,
            updatedBy: entry.UpdatedBy,
            
            fieldData: Object.keys(entry)
              .filter(key => !['EntryId', 'DateCreated', 'DateUpdated', 'CreatedBy', 'UpdatedBy'].includes(key))
              .reduce((acc, key) => {
                acc[key] = entry[key];
                return acc;
              }, {} as Record<string, any>),
            
            rawEntry: entry,
          })),
          rawResponse: parsedResponse,
        };
      } else {
        return {
          success: true,
          message: 'Entries retrieved successfully',
          response: parsedResponse,
        };
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(
          `Form not found: The form with identifier "${formIdentifier}" does not exist or you do not have access to it. Please verify the form identifier and your permissions.`
        );
      }
      
      if (error.response?.status === 400) {
        throw new Error(
          `Bad request: Invalid filter parameters or field IDs. Please check your filter fields and values. Error: ${error.response?.data?.Text || error.message}`
        );
      }
      
      if (error.response?.status === 403) {
        throw new Error(
          'Access denied: You do not have permission to view entries for this form. Please check your Wufoo account permissions and API key scope.'
        );
      }
      
      if (error.response?.status === 401) {
        throw new Error(
          'Authentication failed: Please verify your API key and subdomain are correct in the connection settings.'
        );
      }
      
      throw new Error(
        `Failed to retrieve entries: ${error.message || 'Unknown error occurred'}. Please check your parameters and try again.`
      );
    }
  },
});

interface WufooEntriesResponse {
  Entries: WufooEntry[];
}

interface WufooEntry {
  EntryId: string;
  DateCreated: string;
  DateUpdated: string;
  CreatedBy: string;
  UpdatedBy: string | null;
  
  // Dynamic field data - varies by form
  [key: string]: any;
}
