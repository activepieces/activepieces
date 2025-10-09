import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { ServiceNowRecordSchema } from '../common/types';
import {
  serviceNowAuth,
  tableDropdown,
  createServiceNowClient,
} from '../common/props';

const FindRecordInputSchema = z.object({
  table: z.string().min(1),
  query: z.string().min(1),
  limit: z.number().optional(),
  fields: z.array(z.string()).optional(),
});

export const findRecordAction = createAction({
  name: 'find_record',
  displayName: 'Find Records',
  description: 'Search for records in a ServiceNow table using a query',
  props: {
    ...serviceNowAuth,
    table: tableDropdown,
    query: Property.LongText({
      displayName: 'Query',
      description:
        'ServiceNow encoded query string (e.g., state=1^priority=1). Use the ServiceNow query builder or reference documentation for syntax.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of records to return (default: 100)',
      required: false,
      defaultValue: 100,
    }),
    fields: Property.Array({
      displayName: 'Fields to Return',
      description: 'Specific fields to return (leave empty for all fields)',
      required: false,
    }),
  },
  async run(context) {
    const { table, query, limit, fields } = context.propsValue;

    const input = FindRecordInputSchema.parse({ table, query, limit, fields });
    const client = createServiceNowClient(context.propsValue);

    const result = await client.findRecord(input.table, input.query, {
      limit: input.limit,
      fields: input.fields,
    });

    return result.map((record) => ServiceNowRecordSchema.parse(record));
  },
});
