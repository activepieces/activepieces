import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { ServiceNowRecordSchema } from '../common/types';
import { serviceNowAuth, tableDropdown, createServiceNowClient } from '../common/props';

const CreateRecordInputSchema = z.object({
  table: z.string().min(1),
  fields: z.record(z.any()),
});

export const createRecordAction = createAction({
  name: 'create_record',
  displayName: 'Create Record',
  description: 'Create a new record in a ServiceNow table',
  props: {
    ...serviceNowAuth,
    table: tableDropdown,
    fields: Property.Object({
      displayName: 'Record Fields',
      description: 'Key-value pairs for the record fields',
      required: true,
    }),
  },
  async run(context) {
    const { table, fields } = context.propsValue;

    const input = CreateRecordInputSchema.parse({ table, fields });
    const client = createServiceNowClient(context.propsValue);

    const result = await client.createRecord(input.table, input.fields);
    return ServiceNowRecordSchema.parse(result);
  },
});