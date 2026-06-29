import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableAuth } from '../auth';
import { airtableCommon } from '../common';

export const airtableGetBaseSchemaAiAction = createAction({
  auth: airtableAuth,
  name: 'get_base_schema_ai',
  displayName: 'Get Base Schema (Agent)',
  description: 'Get every table and field in a base.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the full schema of a base — every table with its id, name, and the names and types of all its fields. This is the key resolver: call it to turn a base ID into table IDs and exact field names before reading or writing records. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    base_id: Property.ShortText({
      displayName: 'Base ID',
      description:
        'The Airtable base ID (e.g. "appXXXXXXXXXXXXXX"). Resolve it with List Bases (Agent).',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { base_id } = propsValue;

    const tables = await airtableCommon.fetchTableList({
      token: auth.secret_text,
      baseId: base_id,
    });

    return {
      tables: tables.map((table) => ({
        id: table.id,
        name: table.name,
        description: table.description,
        primaryFieldId: table.primaryFieldId,
        fields: table.fields.map((field) => ({
          id: field.id,
          name: field.name,
          type: field.type,
          description: field.description,
        })),
      })),
      count: tables.length,
    };
  },
});
