import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { ServiceNowRecordSchema } from '../common/types';
import { tableDropdown, createServiceNowClient, servicenowAuth } from '../common/props';

const CreateRecordInputSchema = z.object({
  table: z.string().min(1),
  fields: z.record(z.any()),
  sysparm_display_value: z.enum(['true', 'false', 'all']).optional(),
  sysparm_fields: z.array(z.string()).optional(),
  sysparm_input_display_value: z.boolean().optional(),
  sysparm_view: z.enum(['desktop', 'mobile', 'both']).optional(),
});

export const createRecordAction = createAction({
  auth: servicenowAuth,
  name: 'create_record',
  displayName: 'Create Record',
  description: 'Create a new record in a specified table',
  props: {
    table: tableDropdown,
    fields: Property.Object({
      displayName: 'Record Fields',
      description: 'Field names and values for the new record',
      required: true,
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
    sysparm_fields: Property.Array({
      displayName: 'Fields to Return',
      description: 'Specific fields to include in response (optional)',
      required: false,
    }),
    sysparm_input_display_value: Property.Checkbox({
      displayName: 'Use Display Values for Input',
      description: 'Treat input values as display names instead of IDs',
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
      fields, 
      sysparm_display_value,
      sysparm_fields,
      sysparm_input_display_value,
      sysparm_view
    } = context.propsValue;

    const input = CreateRecordInputSchema.parse({ 
      table, 
      fields,
      sysparm_display_value,
      sysparm_fields,
      sysparm_input_display_value,
      sysparm_view
    });
    
    const client = createServiceNowClient(context.auth);

    const options = {
      sysparm_display_value: input.sysparm_display_value,
      sysparm_fields: input.sysparm_fields,
      sysparm_input_display_value: input.sysparm_input_display_value,
      sysparm_view: input.sysparm_view,
    };

    const result = await client.createRecord(input.table, input.fields, options);
    return ServiceNowRecordSchema.parse(result);
  },
});