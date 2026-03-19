import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { ServiceNowRecordSchema } from '../common/types';
import { tableDropdown, recordDropdown, createServiceNowClient, servicenowAuth } from '../common/props';

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
  auth: servicenowAuth,
  name: 'get_record',
  displayName: 'Get Record',
  description: 'Retrieve a specific record by its ID',
  props: {
    table: tableDropdown,
    record: recordDropdown,
    manual_sys_id: Property.ShortText({
      displayName: 'Or Enter Sys ID Manually',
      description: 'Enter the sys_id directly if not found in dropdown',
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
    sysparm_fields: Property.Array({
      displayName: 'Fields to Return',
      description: 'Specific fields to include in response (optional)',
      required: false,
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
    
    const client = createServiceNowClient(context.auth);

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