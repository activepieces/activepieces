import { createAction, Property } from '@activepieces/pieces-framework';
import { makeServiceNowRequest, servicenowAuth } from '../common/common';

export const findRecordAction = createAction({
  auth: servicenowAuth,
  name: 'find_record',
  displayName: 'Find Record',
  description: 'Look up a record in a specific table by query',
  props: {
    table: Property.ShortText({
      displayName: 'Table Name',
      description: 'The ServiceNow table to search',
      required: true,
    }),
    query: Property.ShortText({
      displayName: 'Query Field',
      description: 'The field name to search by (e.g., number, short_description)',
      required: true,
    }),
    value: Property.ShortText({
      displayName: 'Query Value',
      description: 'The value to search for',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const table = context.propsValue.table;
    const query = context.propsValue.query;
    const value = context.propsValue.value;
    const limit = context.propsValue.limit || 10;
    const encodedValue = encodeURIComponent(value);
    const sysparmQuery = `${query}=${encodedValue}`;

    const response = await makeServiceNowRequest(
      context.auth,
      `/table/${table}?sysparm_query=${sysparmQuery}&sysparm_limit=${limit}&sysparm_exclude_reference_link=true`
    );

    return response.body.result || [];
  },
});