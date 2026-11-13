import { DynamicPropsValue, createAction } from '@activepieces/pieces-framework';
import { TeableCommon } from '../common';
import { teableClient } from '../common/client';
import { TeableAuth } from '../auth';
import { teableOutputSchemas } from '../output-schemas';

export const updateRecordAction = createAction({
  auth: TeableAuth,
  name: 'teable_update_record',
  classification: 'WRITE',
  displayName: 'Update Record',
  description: 'Updates an existing record in a Teable table.',
  audience: 'human',
  aiMetadata: {
    description:
      'Changes the given fields of one existing record; other fields keep their values, and Fields to Clear are emptied. Safe to retry.',
    idempotent: true,
  },
  props: {
    base_id: TeableCommon.base_id,
    table_id: TeableCommon.table_id,
    record_id: TeableCommon.record_id,
    fields: TeableCommon.fields,
    fields_to_clear: TeableCommon.fields_to_clear,
  },
  async run(context) {
    const { table_id, record_id } = context.propsValue;
    const dynamicFields: DynamicPropsValue = context.propsValue.fields;
    const fieldsToClear = context.propsValue.fields_to_clear ?? [];
    const fields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(dynamicFields)) {
      if (value !== undefined && value !== null && value !== '') {
        fields[key] = value;
      }
    }
    for (const name of fieldsToClear) {
      fields[name] = null;
    }
    if (Object.keys(fields).length === 0) {
      throw new Error('Set at least one field value or pick a field to clear.');
    }
    return teableClient.updateRecord({
      auth: context.auth,
      tableId: table_id,
      recordId: record_id,
      fields,
      typecast: true,
    });
  },
  outputSchema: teableOutputSchemas.recordCore,
});
