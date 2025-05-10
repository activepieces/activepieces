import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../..';

export const findListEntry = createAction({
  auth: attioAuth,
  name: 'find_list_entry',
  displayName: 'Find List Entry',
  description: 'Locate a specific entry in a list within Attio based on defined criteria.',
  props: {
    list: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to query',
      required: true,
    }),
    filter: Property.Json({
      displayName: 'Filter',
      description: 'Filter criteria in JSON format (e.g., {"name": "Ada Lovelace"})',
      required: false,
    }),
    sorts: Property.Json({
      displayName: 'Sort',
      description: 'Sorting criteria in JSON format (e.g., [{"direction": "asc", "attribute": "name", "field": "last_name"}])',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of entries to return (default: 100, max: 500)',
      required: false,
      defaultValue: 100,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of entries to skip',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const { list, filter, sorts, limit, offset } = context.propsValue;
    
    const requestBody = {
      filter: filter || {},
      sorts: sorts || [],
      limit: Math.min(limit || 100, 500),
      offset: offset || 0,
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.attio.com/v2/lists/${list}/entries/query`,
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    return response.body;
  },
});
