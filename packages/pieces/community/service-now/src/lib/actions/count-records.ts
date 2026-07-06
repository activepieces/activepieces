import { createAction, Property } from '@activepieces/pieces-framework';
import {
  tableDropdown,
  createServiceNowClient,
  servicenowAuth,
} from '../common/props';

export const countRecordsAction = createAction({
  auth: servicenowAuth,
  name: 'count_records',
  displayName: 'Count Records',
  description:
    'Return the number of records in a table that match an optional encoded query (uses the Aggregate API)',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the count of records in a ServiceNow table via the Aggregate API; an encoded query filters the count, or leaving it empty counts every record in the table. Use when you only need a tally rather than the records themselves. Read-only and idempotent. Requires the table name.',
    idempotent: true,
  },
  props: {
    table: tableDropdown,
    query: Property.LongText({
      displayName: 'Query',
      description:
        'Optional encoded query to filter records (e.g., active=true^state=1)',
      required: false,
    }),
  },
  async run(context) {
    const { table, query } = context.propsValue;
    const client = createServiceNowClient(context.auth);

    const count = await client.countRecords({ table, query });

    return {
      table,
      query: query ?? null,
      count,
    };
  },
});
