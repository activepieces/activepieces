import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../..';

export const findRecord = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'findRecord',
  displayName: 'Find Record',
  description: 'Retrieve records in Attio by filtering criteria.',
  auth: attioAuth,
  props: {
    object: Property.ShortText({
      displayName: 'Object',
      description: 'The object to find records for (e.g. people, companies).',
      required: true,
    }),
    filter: Property.Object({
      displayName: 'Filter',
      description: 'Filter criteria to apply. For example: {"name": "John Doe"}',
      required: false,
    }),
    sorts: Property.Array({
      displayName: 'Sort',
      description: 'Sort order for results',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of records to return (default: 500)',
      required: false,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of records to skip (default: 0)',
      required: false,
    }),
  },
  async run(ctx) {
    const { object, filter, sorts, limit, offset } = ctx.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.attio.com/v2/objects/${object}/records/query`,
      headers: {
        'Authorization': `Bearer ${ctx.auth}`,
        'Content-Type': 'application/json',
      },
      body: {
        filter: filter || {},
        sorts: sorts || [],
        limit: limit || 500,
        offset: offset || 0,
      },
    });

    if (response.status === 200) {
      return response.body;
    } else {
      throw new Error(`Error finding records: ${response.body?.message || response.status}`);
    }
  },
});
