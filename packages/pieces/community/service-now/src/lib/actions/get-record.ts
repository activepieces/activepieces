import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { ServiceNowRecordSchema } from '../common/types';
import { serviceNowAuth, tableDropdown, recordDropdown, createServiceNowClient } from '../common/props';

const GetRecordInputSchema = z.object({
  table: z.string().min(1),
  sys_id: z.string().min(1),
  fields: z.array(z.string()).optional(),
});

export const getRecordAction = createAction({
  name: 'get_record',
  displayName: 'Get Record',
  description: 'Retrieve a specific record from a ServiceNow table',
  props: {
    ...serviceNowAuth,
    table: tableDropdown,
    record: recordDropdown,
    manual_sys_id: Property.ShortText({
      displayName: 'Or Enter Sys ID Manually',
      description: 'Enter the sys_id directly if not found in dropdown',
      required: false,
    }),
    fields: Property.Array({
      displayName: 'Fields to Return',
      description: 'Specific fields to return (leave empty for all fields)',
      required: false,
    }),
  },
  async run(context) {
    const { table, record, manual_sys_id, fields } = context.propsValue;

    const recordId = record || manual_sys_id;
    if (!recordId) {
      throw new Error('Either record selection or manual sys_id must be provided');
    }
    
    const input = GetRecordInputSchema.parse({ table, sys_id: recordId, fields });
    const client = createServiceNowClient(context.propsValue);

    const result = await client.getRecord(input.table, input.sys_id);
    return ServiceNowRecordSchema.parse(result);
  },
});