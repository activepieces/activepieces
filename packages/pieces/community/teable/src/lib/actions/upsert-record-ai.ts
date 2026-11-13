import { Property, createAction } from '@activepieces/pieces-framework';
import { TeableAuth } from '../auth';
import { teableAgent } from '../common/agent';
import { TeableAgentProps } from '../common';
import { teableClient } from '../common/client';
import { teableOutputSchemas } from '../output-schemas';

export const upsertRecordAi = createAction({
  auth: TeableAuth,
  name: 'upsert_record_ai',
  classification: 'WRITE',
  displayName: 'Upsert Record (Agent)',
  description: 'Updates the record whose key field matches, or creates it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Finds the record whose key field exactly equals the key value in Fields (the Teable "is" filter on that field). If none exists it creates one; if one exists it updates it, where a null value clears that field; if several match it stops with an error and changes nothing. Use this to avoid duplicates, e.g. key on Email, but run upserts for the same key one at a time: Teable has no atomic create-if-absent, so two parallel calls with the same new key can both create a record; when the action detects that after creating, it returns a warning. Needs the base ID, the table name or ID, the key field, and Fields including the key value. Returns {action: "created" or "updated", record, warning?}. Safe to retry.',
    idempotent: true,
  },
  props: {
    baseId: TeableAgentProps.base_id,
    table: TeableAgentProps.table,
    keyColumn: Property.ShortText({
      displayName: 'Key Field (name or ID)',
      description: 'The field that identifies the record, e.g. Email.',
      required: true,
    }),
    fields: TeableAgentProps.fields,
  },
  outputSchema: teableOutputSchemas.upsertRecord,
  async run({ auth, propsValue }) {
    const baseId = teableAgent.requireText({ value: propsValue.baseId, label: 'Base ID' });
    const reference = teableAgent.requireText({ value: propsValue.table, label: 'Table' });
    const keyColumn = teableAgent.requireText({ value: propsValue.keyColumn, label: 'Key Field' });
    const input = teableAgent.parseFieldsInput(propsValue.fields);
    const table = await teableAgent.resolveTable({ auth, baseId, reference });
    const fields = await teableClient.listFields({ auth, tableId: table.id });
    return teableAgent.upsertRecord({ auth, table, fields, keyColumn, input });
  },
});
