import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableAuth } from '../auth';
import { airtableCommon } from '../common';
import { AirtableFieldConfig } from '../common/models';
import { createTableAiActionOutputSchema } from '../output-schemas';

export const airtableCreateTableAiAction = createAction({
  auth: airtableAuth,
  name: 'create_table_ai',
  displayName: 'Create Table (Agent)',
  description: 'Create a new table in an existing base.',
  audience: 'ai',
  outputSchema: createTableAiActionOutputSchema,
  aiMetadata: {
    description:
      'Creates a new table in an existing base from a JSON array of field definitions (the first field becomes the primary field), with an optional description. Requires a token with the schema.bases:write scope. Not idempotent — each call creates a new table.',
    idempotent: false,
  },
  props: {
    base_id: Property.ShortText({
      displayName: 'Base ID',
      description:
        'The Airtable base ID (e.g. "appXXXXXXXXXXXXXX"). Resolve it with List Bases (Agent).',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Table Name',
      description: 'The name for the new table.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Optional description for the new table.',
      required: false,
    }),
    fields: Property.Json({
      displayName: 'Fields',
      description:
        'A JSON array of field definitions; the first entry becomes the primary field. Each entry is {"name": "...", "type": "singleLineText", "description"?: "..."}. Select fields need {"type": "singleSelect", "options": {"choices": [{"name": "Todo"}]}}.',
      required: true,
      defaultValue: [
        {
          name: 'Name',
          type: 'singleLineText',
          description: 'This will be the primary field',
        },
        {
          name: 'Notes',
          type: 'multilineText',
        },
      ],
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { base_id, name, description, fields } = propsValue;

    return await airtableCommon.createTable({
      personalToken: auth.secret_text,
      baseId: base_id,
      name,
      description: description as string | undefined,
      fields: fields as unknown as AirtableFieldConfig[],
    });
  },
});
