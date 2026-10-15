import { createAction } from '@activepieces/pieces-framework';
import { TeableAuth } from '../auth';
import { teableAgent } from '../common/agent';
import { TeableAgentProps } from '../common';
import { teableClient } from '../common/client';
import { teableOutputSchemas } from '../output-schemas';

export const updateRecordAi = createAction({
  auth: TeableAuth,
  name: 'update_record_ai',
  classification: 'WRITE',
  displayName: 'Update Record (Agent)',
  description: 'Changes some fields of a Teable record using field names.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes the given fields of one existing Teable record; other fields stay as they are, and a value of null clears a field. Agents: use this instead of Update Record. Needs the base ID, the table name or ID, the record ID, and a JSON object of new values keyed by field name (case-insensitive) or field ID. Returns the updated record with values keyed by field name. Safe to retry.',
    idempotent: true,
  },
  props: {
    baseId: TeableAgentProps.base_id,
    table: TeableAgentProps.table,
    recordId: TeableAgentProps.record_id,
    fields: TeableAgentProps.fields,
  },
  outputSchema: teableOutputSchemas.recordCore,
  async run({ auth, propsValue }) {
    const baseId = teableAgent.requireText({ value: propsValue.baseId, label: 'Base ID' });
    const reference = teableAgent.requireText({ value: propsValue.table, label: 'Table' });
    const recordId = teableAgent.requireText({ value: propsValue.recordId, label: 'Record ID' });
    const input = teableAgent.parseFieldsInput(propsValue.fields);
    const table = await teableAgent.resolveTable({ auth, baseId, reference });
    const fields = await teableClient.listFields({ auth, tableId: table.id });
    const values = teableAgent.buildRecordFields({ fields, input, allowClear: true });
    const updated = await teableClient.updateRecord({
      auth,
      tableId: table.id,
      recordId,
      fields: values,
      fieldKeyType: 'id',
      typecast: true,
    });
    return teableAgent.mapFieldIdsToNames({ fields, record: updated });
  },
});
