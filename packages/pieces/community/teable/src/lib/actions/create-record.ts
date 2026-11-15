import { DynamicPropsValue, createAction } from '@activepieces/pieces-framework';
import { TeableCommon } from '../common';
import { teableClient } from '../common/client';
import { TeableAuth } from '../auth';
import { teableOutputSchemas } from '../output-schemas';

export const createRecordAction = createAction({
  auth: TeableAuth,
  name: 'teable_create_record',
  classification: 'WRITE',
  displayName: 'Create Record',
  description: 'Creates a new record in a Teable table.',
  audience: 'human',
  aiMetadata: {
    description:
      'Adds one new row to a Teable table. Each call appends another record, so a retry makes a duplicate.',
    idempotent: false,
  },
  props: {
    base_id: TeableCommon.base_id,
    table_id: TeableCommon.table_id,
    fields: TeableCommon.fields,
  },
  outputSchema: teableOutputSchemas.createRecord,
  async run(context) {
    const { table_id } = context.propsValue;
    const dynamicFields: DynamicPropsValue = context.propsValue.fields;
    const fields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(dynamicFields)) {
      if (value !== undefined && value !== null && value !== '') {
        fields[key] = value;
      }
    }
    if (Object.keys(fields).length === 0) {
      throw new Error('Fill in at least one field value.');
    }
    return teableClient.createRecords({
      auth: context.auth,
      tableId: table_id,
      records: [{ fields }],
      typecast: true,
    });
  },
});
