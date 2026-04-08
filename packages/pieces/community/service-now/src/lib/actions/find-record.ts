import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { ServiceNowRecordSchema } from '../common/types';
import {
  tableDropdown,
  createServiceNowClient,
  servicenowAuth,
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
  auth: servicenowAuth,
  name: 'find_record',
  displayName: 'Find Records',
  description: 'Search for records in a table using a query',
  props: {
    table: tableDropdown,
    query: Property.LongText({
      displayName: 'Query',
      description: 'Encoded query string (e.g., state=1^priority=1)',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum records to return',
      required: false,
      defaultValue: 100,
    }),
    fields: Property.Array({
      displayName: 'Fields to Return',
      description: 'Specific fields to include in response (optional)',
      required: false,
    }),
    sysparm_display_value: Property.StaticDropdown({
      displayName: 'Return Display Values',
      description: 'How to format the response data',
      required: false,
      defaultValue: 'false',
      options: {
        disabled: false,
        options: [
          { label: 'Actual values', value: 'false' },
          { label: 'Display values', value: 'true' },
          { label: 'Both', value: 'all' },
        ],
      },
    }),
    sysparm_exclude_reference_link: Property.Checkbox({
      displayName: 'Exclude Reference Links',
      description: 'Exclude API links for reference fields',
      required: false,
      defaultValue: false,
    }),
    sysparm_query_no_domain: Property.Checkbox({
      displayName: 'Query No Domain',
      description: 'Include records from all domains',
      required: false,
      defaultValue: false,
    }),
    sysparm_view: Property.StaticDropdown({
      displayName: 'UI View',
      description: 'View context for returned fields',
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

    const client = createServiceNowClient(context.auth);

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
