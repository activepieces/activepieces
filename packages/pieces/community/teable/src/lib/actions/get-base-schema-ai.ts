import { createAction } from '@activepieces/pieces-framework';
import { TeableAuth } from '../auth';
import { teableAgent } from '../common/agent';
import { TeableAgentProps, teableProps } from '../common';
import { teableClient } from '../common/client';
import { teableOutputSchemas } from '../output-schemas';

export const getBaseSchemaAi = createAction({
  auth: TeableAuth,
  name: 'get_base_schema_ai',
  classification: 'READ',
  displayName: 'Get Base Schema (Agent)',
  description: 'Gets every table and field in a Teable base.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns every table in a Teable base with all its fields: field ID, name, type, primary/computed flags, and select options. Call this first, before you create, update, or search records. Needs the base ID from List Bases. Read-only.',
    idempotent: true,
  },
  props: {
    baseId: TeableAgentProps.base_id,
  },
  outputSchema: teableOutputSchemas.baseSchema,
  async run({ auth, propsValue }) {
    const baseId = teableAgent.requireText({ value: propsValue.baseId, label: 'Base ID' });
    const tables = await teableClient.listTables({ auth, baseId });
    const tablesWithFields = [];
    for (const table of tables) {
      const fields = await teableClient.listFields({ auth, tableId: table.id });
      tablesWithFields.push({
        id: table.id,
        name: table.name,
        description: table.description ?? null,
        fields: fields.map((field) => ({
          id: field.id,
          name: field.name,
          type: field.type,
          isPrimary: field.isPrimary ?? false,
          writable: teableProps.isRecordWritableField(field),
          notNull: field.notNull ?? false,
          unique: field.unique ?? false,
          options: (field.options?.choices ?? []).map((choice) => ({
            id: choice.id,
            name: choice.name,
          })),
        })),
      });
    }
    return { baseId, tableCount: tablesWithFields.length, tables: tablesWithFields };
  },
});
