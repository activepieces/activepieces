import {
  DynamicPropsValue,
  createAction,
} from '@activepieces/pieces-framework';
import { TeableCommon, makeClient } from '../common';
import { TeableAuth, TeableAuthValue } from '../auth';

export const createRecordAction = createAction({
  auth: TeableAuth,
  name: 'teable_create_record',
  displayName: 'Create Record',
  description: 'Creates a new record in a Teable table.',
  audience: 'both',
  aiMetadata: {
    description: 'Insert a new row into a specific Teable table within a base, populating its field values. Use when an agent needs to add data to a no-code database; requires the target table ID and a fields object keyed by field name. Not idempotent — each call appends another record even with identical input.',
    idempotent: false,
  },
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

    const client = makeClient(context.auth as TeableAuthValue);
    return await client.createRecord(table_id, {
      records: [{ fields }],
    });
  },
});

