import { createAction } from '@activepieces/pieces-framework';
import { TeableAuth } from '../auth';
import { teableAgent } from '../common/agent';
import { TeableAgentProps } from '../common';
import { teableClient } from '../common/client';
import { teableOutputSchemas } from '../output-schemas';

export const createRecordAi = createAction({
  auth: TeableAuth,
  name: 'create_record_ai',
  classification: 'WRITE',
  displayName: 'Create Record (Agent)',
  description: 'Adds a record to a Teable table using field names.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds one new record to a Teable table. Agents: use this instead of Create Record. Needs the base ID, the table name or ID, and a JSON object of values keyed by field name (case-insensitive) or field ID — see Get Base Schema (Agent). Values are typecast, so select options, links, and users accept names. Returns the new record with values keyed by field name. Each call adds a new record, so a retry makes a duplicate; use Upsert Record (Agent) to avoid that.',
    idempotent: false,
  },
  props: {
    baseId: TeableAgentProps.base_id,
    table: TeableAgentProps.table,
    fields: TeableAgentProps.fields,
  },
  outputSchema: teableOutputSchemas.recordCore,
  async run({ auth, propsValue }) {
    const baseId = teableAgent.requireText({ value: propsValue.baseId, label: 'Base ID' });
    const reference = teableAgent.requireText({ value: propsValue.table, label: 'Table' });
    const input = teableAgent.parseFieldsInput(propsValue.fields);
    const table = await teableAgent.resolveTable({ auth, baseId, reference });
    const fields = await teableClient.listFields({ auth, tableId: table.id });
    const values = teableAgent.buildRecordFields({ fields, input, allowClear: false });
    const created = await teableClient.createRecords({
      auth,
      tableId: table.id,
      records: [{ fields: values }],
      fieldKeyType: 'id',
      typecast: true,
    });
    return teableAgent.mapFieldIdsToNames({ fields, record: created.records[0] });
  },
});
