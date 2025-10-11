import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { ServiceNowRecordSchema } from '../common/types';
import { serviceNowAuth, tableDropdown, recordDropdown, createServiceNowClient } from '../common/props';

const GetRecordInputSchema = z.object({
  table: z.string().min(1),
  sys_id: z.string().min(1),
  sysparm_display_value: z.enum(['true', 'false', 'all']).optional(),
  sysparm_exclude_reference_link: z.boolean().optional(),
  sysparm_fields: z.array(z.string()).optional(),
  sysparm_query_no_domain: z.boolean().optional(),
  sysparm_view: z.enum(['desktop', 'mobile', 'both']).optional(),
});

export const getRecordAction = createAction({
  name: 'get_record',
  displayName: 'Get Record',
  description: 'Retrieve a specific record from a ServiceNow table using GET method',
  props: {
    ...serviceNowAuth,
    table: tableDropdown,
    record: recordDropdown,
    manual_sys_id: Property.ShortText({
      displayName: 'Or Enter Sys ID Manually',
      description: 'Enter the sys_id directly if not found in dropdown',
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
      description: 'Set to true to exclude Table API links for reference fields (improves performance)',
      required: false,
      defaultValue: false,
    }),
    sysparm_fields: Property.Array({
      displayName: 'Fields to Return',
      description: 'Comma-separated list of fields to return in the response (leave empty for all fields)',
      required: false,
    }),
    sysparm_query_no_domain: Property.Checkbox({
      displayName: 'Query No Domain',
      description: 'Include records from domains the user is not configured to access (requires admin or query_no_domain_table_api role)',
      required: false,
      defaultValue: false,
    }),
    sysparm_view: Property.StaticDropdown({
      displayName: 'UI View',
      description: 'UI view for which to render the data. If sysparm_fields is also specified, it takes precedence.',
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
      record, 
      manual_sys_id, 
      sysparm_display_value,
      sysparm_exclude_reference_link,
      sysparm_fields,
      sysparm_query_no_domain,
      sysparm_view
    } = context.propsValue;

    const recordId = record || manual_sys_id;
    if (!recordId) {
      throw new Error('Either record selection or manual sys_id must be provided');
    }
    
    const input = GetRecordInputSchema.parse({ 
      table, 
      sys_id: recordId, 
      sysparm_display_value,
      sysparm_exclude_reference_link,
      sysparm_fields,
      sysparm_query_no_domain,
      sysparm_view
    });
    
    const client = createServiceNowClient(context.propsValue);

    const options = {
      sysparm_display_value: input.sysparm_display_value,
      sysparm_exclude_reference_link: input.sysparm_exclude_reference_link,
      sysparm_fields: input.sysparm_fields,
      sysparm_query_no_domain: input.sysparm_query_no_domain,
      sysparm_view: input.sysparm_view,
    };

    const result = await client.getRecord(input.table, input.sys_id, options);
    return ServiceNowRecordSchema.parse(result);
  },
});