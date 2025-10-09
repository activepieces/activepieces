import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { ServiceNowRecordSchema } from '../common/types';
import { serviceNowAuth, tableDropdown, recordDropdown, createServiceNowClient } from '../common/props';

const UpdateRecordInputSchema = z.object({
  table: z.string().min(1),
  sys_id: z.string().min(1),
  fields: z.record(z.any()),
});

export const updateRecordAction = createAction({
  name: 'update_record',
  displayName: 'Update Record',
  description: 'Update an existing record in a ServiceNow table',
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
      description: 'Key-value pairs for the fields to update',
      required: true,
    }),
  },
  async run(context) {
    const { table, record, manual_sys_id, fields } = context.propsValue;
    
    const recordId = record || manual_sys_id;
    if (!recordId) {
      throw new Error('Either record selection or manual sys_id must be provided');
    }
    
    const input = UpdateRecordInputSchema.parse({ table, sys_id: recordId, fields });
    const client = createServiceNowClient(context.propsValue);

    const result = await client.updateRecord(input.table, input.sys_id, input.fields);
    return ServiceNowRecordSchema.parse(result);
  },
});