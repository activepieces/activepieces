import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { ServiceNowRecordSchema } from '../common/types';
import {
  serviceNowAuth,
  tableDropdown,
  recordDropdown,
  createServiceNowClient,
} from '../common/props';

const UpdateRecordInputSchema = z.object({
  table: z.string().min(1),
  sys_id: z.string().min(1),
  fields: z.record(z.any()),
  sysparm_display_value: z.enum(['true', 'false', 'all']).optional(),
  sysparm_fields: z.array(z.string()).optional(),
  sysparm_input_display_value: z.boolean().optional(),
  sysparm_view: z.enum(['desktop', 'mobile', 'both']).optional(),
});

export const updateRecordAction = createAction({
  name: 'update_record',
  displayName: 'Update Record',
  description:
    'Update an existing record in a ServiceNow table using PATCH method',
  props: {
    ...serviceNowAuth,
    table: tableDropdown,
    record: recordDropdown,
    manual_sys_id: Property.ShortText({
      displayName: 'Or Enter Sys ID Manually',
      description: 'Enter the sys_id directly if not found in dropdown',
      required: false,
    }),
    fields: Property.Object({
      displayName: 'Record Fields',
      description:
        'Key-value pairs for the fields to update. Note: System fields (prefixed with "sys_") are typically read-only.',
      required: true,
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
    sysparm_fields: Property.Array({
      displayName: 'Fields to Return',
      description:
        'Comma-separated list of fields to return in the response (leave empty for all fields)',
      required: false,
    }),
    sysparm_input_display_value: Property.Checkbox({
      displayName: 'Use Display Values for Input',
      description:
        'Set to true to treat input values as display values (e.g., reference field names instead of sys_ids). Required for encrypted fields.',
      required: false,
      defaultValue: false,
    }),
    sysparm_view: Property.StaticDropdown({
      displayName: 'UI View',
      description: 'UI view for which to render the data',
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
      fields,
      sysparm_display_value,
      sysparm_fields,
      sysparm_input_display_value,
      sysparm_view,
    } = context.propsValue;

    const recordId = record || manual_sys_id;
    if (!recordId) {
      throw new Error(
        'Either record selection or manual sys_id must be provided'
      );
    }

    const input = UpdateRecordInputSchema.parse({
      table,
      sys_id: recordId,
      fields,
      sysparm_display_value,
      sysparm_fields,
      sysparm_input_display_value,
      sysparm_view,
    });

    const client = createServiceNowClient(context.propsValue);

    const options = {
      sysparm_display_value: input.sysparm_display_value,
      sysparm_fields: input.sysparm_fields,
      sysparm_input_display_value: input.sysparm_input_display_value,
      sysparm_view: input.sysparm_view,
    };

    const result = await client.updateRecord(
      input.table,
      input.sys_id,
      input.fields,
      options
    );
    return ServiceNowRecordSchema.parse(result);
  },
});
