import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../index';
import { makeRequest } from '../common/client';

export const findRecordAction = createAction({
  name: 'find_record',
  displayName: 'Find Record',
  description: 'Find records in Attio that match specified criteria',
  auth: attioAuth,
  props: {
    object_type: Property.ShortText({
      displayName: 'Object Type',
      description: 'The type of record to find (e.g., people, companies, deals)',
      required: true,
    }),
    filter_criteria: Property.Object({
      displayName: 'Filter Criteria',
      description: 'Simple filter criteria as key-value pairs. For advanced filtering, use the raw filter option.',
      required: false,
    }),
    raw_filter: Property.Json({
      displayName: 'Raw Filter',
      description: 'Advanced filter in Attio format. See Attio API docs for complex filter structures. Will override simple filter criteria if provided.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Result Limit',
      description: 'Maximum number of records to return',
      required: false,
      defaultValue: 100,
    }),
    offset: Property.Number({
      displayName: 'Result Offset',
      description: 'Number of records to skip',
      required: false,
      defaultValue: 0,
    }),
  },
  async run({ auth, propsValue }) {
    const { object_type, filter_criteria, raw_filter, limit, offset } = propsValue;

    // Build the request body
    let filter = raw_filter;

    // If no raw filter is provided, build one from the filter criteria
    if (!filter && filter_criteria) {
      // Create simple filter entries for each key-value pair
      const filterEntries = Object.entries(filter_criteria).map(([key, value]) => {
        // For simple key-value pairs
        return { [key]: value };
      });

      // If we have multiple criteria, combine them with $and
      if (filterEntries.length > 1) {
        filter = { $and: filterEntries };
      } else if (filterEntries.length === 1) {
        // Just use the single filter entry
        filter = filterEntries[0];
      }
    }

    // Prepare request body
    const requestBody: Record<string, unknown> = {};

    // Add filter if specified
    if (filter) {
      requestBody['filter'] = filter;
    }

    // Add pagination parameters
    if (limit !== undefined) {
      requestBody['limit'] = limit;
    }

    if (offset !== undefined) {
      requestBody['offset'] = offset;
    }

    // Make the request
    const response = await makeRequest(
      auth,
      HttpMethod.POST,
      `/objects/${object_type}/records/query`,
      requestBody
    );

    return response;
  },
});
