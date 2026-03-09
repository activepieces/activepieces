import {
  DynamicPropsValue,
  createAction,
} from '@activepieces/pieces-framework';
import { TeableCommon, makeClient } from '../common';
import { TeableAuth } from '../auth';

export const createRecordAction = createAction({
  auth: TeableAuth,
  name: 'teable_create_record',
  displayName: 'Create Record',
  description: 'Creates a new record in a Teable table.',
  props: {
    base_id: TeableCommon.base_id,
    table_id: TeableCommon.table_id,
    fields: TeableCommon.fields,
  },
  async run(context) {
    const { table_id } = context.propsValue;
    const dynamicFields: DynamicPropsValue = context.propsValue.fields;

    const fields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(dynamicFields)) {
      if (value !== undefined && value !== null && value !== '') {
        fields[key] = value;
      }
    }

    const client = makeClient(context.auth.props);
    return await client.createRecord(table_id, {
      records: [{ fields }],
    });
  },
});

