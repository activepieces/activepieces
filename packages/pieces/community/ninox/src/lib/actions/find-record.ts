import { createAction, Property } from '@activepieces/pieces-framework';
import { NinoxAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamidDropdown, databaseIdDropdown, tableIdDropdown } from '../common/props';

export const findRecord = createAction({
  auth: NinoxAuth,
  name: 'findRecord',
  displayName: 'Find Record',
  description: 'Search for a record by field values.',
  props: {
    teamid: teamidDropdown,
    dbid: databaseIdDropdown,
    tid: tableIdDropdown,
    searchField: Property.ShortText({
      displayName: 'Search Field',
      description: 'The field name to search in (e.g., "First Name", "Email")',
      required: true,
    }),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'The value to search for in the specified field',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of records to return (default: 100)',
      required: false,
      defaultValue: 100,
    }),
  },
  async run({ auth, propsValue }) {
    const { teamid, dbid, tid, searchField, searchValue, limit } = propsValue;
    
    // Build the query to search for records
    const query = `(select ${tid} where '${searchField}' = '${searchValue}')`;
    const path = `/teams/${teamid}/databases/${dbid}/${query}`;
    
    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.GET,
        path
      );
      
      // Limit the results if specified
      const results = Array.isArray(response) ? response.slice(0, limit) : response;
      
      return {
        success: true,
        message: `Found ${results.length} record(s)`,
        records: results,
        totalFound: Array.isArray(response) ? response.length : 1,
        searchCriteria: {
          field: searchField,
          value: searchValue,
        },
      };
    } catch (error) {
      throw new Error(`Failed to find records: ${error}`);
    }
  },
});
