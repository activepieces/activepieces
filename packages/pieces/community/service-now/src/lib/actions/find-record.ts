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
  sysparm_display_value: z.enum(['true', 'false', 'all']).optional(),
  sysparm_exclude_reference_link: z.boolean().optional(),
  sysparm_query_no_domain: z.boolean().optional(),
  sysparm_view: z.enum(['desktop', 'mobile', 'both']).optional(),
});

export const findRecordAction = createAction({
  name: 'find_record',
  displayName: 'Find Records',
  description:
    'Search for records in a ServiceNow table using GET /now/table/{tableName} with query parameters',
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
    sysparm_display_value: Property.StaticDropdown({
      displayName: 'Display Value Type',
      description: 'Determines the type of data returned in the response',
      required: false,
      defaultValue: 'false',
      options: {
        disabled: false,
        options: [
          { label: 'Actual values from database', value: 'false' },
          { label: 'Display values (user-friendly)', value: 'true' },
          { label: 'Both actual and display values', value: 'all' },
        ],
      },
    }),
    sysparm_exclude_reference_link: Property.Checkbox({
      displayName: 'Exclude Reference Links',
      description:
        'Set to true to exclude Table API links for reference fields (improves performance)',
      required: false,
      defaultValue: false,
    }),
    sysparm_query_no_domain: Property.Checkbox({
      displayName: 'Query No Domain',
      description:
        'Include records from domains the user is not configured to access (requires admin or query_no_domain_table_api role)',
      required: false,
      defaultValue: false,
    }),
    sysparm_view: Property.StaticDropdown({
      displayName: 'UI View',
      description:
        'UI view for which to render the data. If sysparm_fields is also specified, it takes precedence.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Desktop', value: 'desktop' },
          { label: 'Mobile', value: 'mobile' },
          { label: 'Both', value: 'both' },
        ],
      },
    }),
  },
  async run(context) {
    const {
      table,
      query,
      limit,
      fields,
      sysparm_display_value,
      sysparm_exclude_reference_link,
      sysparm_query_no_domain,
      sysparm_view,
    } = context.propsValue;

    const input = FindRecordInputSchema.parse({
      table,
      query,
      limit,
      fields,
      sysparm_display_value,
      sysparm_exclude_reference_link,
      sysparm_query_no_domain,
      sysparm_view,
    });

    const client = createServiceNowClient(context.propsValue);

    const options = {
      limit: input.limit,
      fields: input.fields,
      sysparm_display_value: input.sysparm_display_value,
      sysparm_exclude_reference_link: input.sysparm_exclude_reference_link,
      sysparm_query_no_domain: input.sysparm_query_no_domain,
      sysparm_view: input.sysparm_view,
    };

    const result = await client.findRecord(input.table, input.query, options);

    return result.map((record) => ServiceNowRecordSchema.parse(record));
  },
});
