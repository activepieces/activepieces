import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wufooApiCall } from '../common/client';
import { wufooAuth } from '../../index';
import { formIdentifier } from '../common/props';

export const findSubmissionByFieldAction = createAction({
  auth: wufooAuth,
  name: 'find-submission-by-field',
  displayName: 'Find Submission by Field Value',
  description: 'Search for form submissions by field value for deduplication and lookup operations.',
  props: {
    formIdentifier: formIdentifier,
    format: Property.StaticDropdown({
      displayName: 'Response Format',
      description: 'Choose the format for the API response. JSON is recommended for most workflows.',
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
    
    fieldId: Property.ShortText({
      displayName: 'Field ID',
      description: 'The form field to search in (e.g., Field1 for first name, Field218 for email). You can find Field IDs in the form builder or via the Form Fields API.',
      required: true,
    }),
    
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'The value to search for in the specified field. For exact matches, use the complete value.',
      required: true,
    }),
    
    matchType: Property.StaticDropdown({
      displayName: 'Match Type',
      description: 'How to match the search value with field data. Choose based on your use case.',
      required: true,
      defaultValue: 'Is_equal_to',
      options: {
        disabled: false,
        options: [
          { label: 'Exact Match', value: 'Is_equal_to' },
          { label: 'Contains Text', value: 'Contains' },
          { label: 'Starts With', value: 'Begins_with' },
          { label: 'Ends With', value: 'Ends_with' },
          { label: 'Does Not Contain', value: 'Does_not_contain' },
          { label: 'Is Not Equal To', value: 'Is_not_equal_to' },
        ],
      },
    }),
    
    maxResults: Property.Number({
      displayName: 'Maximum Results',
      description: 'Limit the number of results returned (1-50). Lower numbers are faster for deduplication checks.',
      required: false,
      defaultValue: 10,
    }),
    
    sortOrder: Property.StaticDropdown({
      displayName: 'Sort Order',
      description: 'Order to return results. "Newest First" is best for finding recent duplicates.',
      required: false,
      defaultValue: 'DESC',
      options: {
        disabled: false,
        options: [
          { label: 'Newest First', value: 'DESC' },
          { label: 'Oldest First', value: 'ASC' },
        ],
      },
    }),
    
    includeMetadata: Property.Checkbox({
      displayName: 'Include Metadata',
      description: 'Include additional information like submission date, IP address, and creation details.',
      required: false,
      defaultValue: false,
    }),
  },
  
  async run(context) {
    const {
      formIdentifier,
      format,
      fieldId,
      searchValue,
      matchType,
      maxResults,
      sortOrder,
      includeMetadata,
    } = context.propsValue;

    try {
      const query: Record<string, string> = {
        pageStart: '0',
        pageSize: String(Math.min(maxResults ?? 10, 50)),
        system: includeMetadata ? 'true' : 'false',
        pretty: 'false',
        
        Filter1: `${fieldId}+${matchType}+${encodeURIComponent(searchValue)}`,
        
        sort: 'EntryId',
        sortDirection: sortOrder || 'DESC',
      };

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
        
        const result = {
          success: true,
          found: entries.length > 0,
          message: entries.length > 0 
            ? `Found ${entries.length} submission(s) matching the search criteria`
            : `No submissions found with ${fieldId} ${matchType.replace('_', ' ').toLowerCase()} "${searchValue}"`,
          
          searchCriteria: {
            fieldId,
            searchValue,
            matchType: matchType.replace('_', ' ').toLowerCase(),
            formIdentifier,
          },
          
          resultCount: entries.length,
          
          firstMatch: entries.length > 0 ? {
            entryId: entries[0].EntryId,
            dateCreated: entries[0].DateCreated,
            matchedFieldValue: entries[0][fieldId],
            
             keyFields: {
               [fieldId]: entries[0][fieldId],
               ...(entries[0]['Field1'] && { name_first: entries[0]['Field1'] }),
               ...(entries[0]['Field2'] && { name_last: entries[0]['Field2'] }),
               ...(entries[0]['Field218'] && { email: entries[0]['Field218'] }),
               ...(entries[0]['Field220'] && { phone: entries[0]['Field220'] }),
             },
          } : null,
          
          allMatches: entries.map(entry => ({
            entryId: entry.EntryId,
            dateCreated: entry.DateCreated,
            dateUpdated: entry.DateUpdated,
            matchedFieldValue: entry[fieldId],
            
            allFields: Object.keys(entry)
              .filter(key => !['EntryId', 'DateCreated', 'DateUpdated', 'CreatedBy', 'UpdatedBy'].includes(key))
              .reduce((acc, key) => {
                acc[key] = entry[key];
                return acc;
              }, {} as Record<string, any>),
          })),
          
          rawResponse: parsedResponse,
        };
        
        return result;
      } else {
        return {
          success: true,
          message: 'Search completed successfully',
          response: parsedResponse,
        };
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(
          `Form not found: The form with identifier "${formIdentifier}" does not exist. Please verify the form identifier is correct.`
        );
      }
      
      if (error.response?.status === 400) {
        throw new Error(
          `Invalid search parameters: The field ID "${fieldId}" may not exist in this form, or the search value contains invalid characters. Please check the field ID and search value.`
        );
      }
      
      if (error.response?.status === 403) {
        throw new Error(
          'Access denied: You do not have permission to search entries in this form. Please check your Wufoo account permissions.'
        );
      }
      
      if (error.response?.status === 401) {
        throw new Error(
          'Authentication failed: Please verify your API key and subdomain are correct in the connection settings.'
        );
      }
      
      throw new Error(
        `Search failed: ${error.message || 'Unknown error occurred'}. Please check your search parameters and try again.`
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

  [key: string]: any;
}
