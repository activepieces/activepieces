import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableAuth } from '../auth';
import { airtableCommon } from '../common';
import { AirtableTableConfig } from '../common/models';
import { createBaseAiActionOutputSchema } from '../output-schemas';

export const airtableCreateBaseAiAction = createAction({
  auth: airtableAuth,
  name: 'create_base_ai',
  displayName: 'Create Base (Agent)',
  description: 'Create a new base in a workspace.',
  audience: 'ai',
  outputSchema: createBaseAiActionOutputSchema,
  aiMetadata: {
    description:
      'Creates a new Airtable base in a workspace, seeded with one or more tables defined by a JSON structure (the first field of each table is its primary field). Requires a token with the schema.bases:write scope. There is no list-workspaces endpoint: obtain the workspaceId from an existing base\'s URL/metadata or the Airtable UI. Not idempotent — each call creates a separate base.',
    idempotent: false,
  },
  props: {
    workspace_id: Property.ShortText({
      displayName: 'Workspace ID',
      description:
        'The workspace ID (e.g. "wspXXXXXXXXXXXXXX") to create the base in. Airtable has no list-workspaces API; get it from a base\'s metadata or the Airtable UI URL.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Base Name',
      description: 'The name for the new base.',
      required: true,
    }),
    tables: Property.Json({
      displayName: 'Tables',
      description:
        'A JSON array of tables for the new base. Each table is {"name": "...", "fields": [{"name": "Name", "type": "singleLineText"}, ...]}. The first field of each table becomes its primary field.',
      required: true,
      defaultValue: [
        {
          name: 'My First Table',
          fields: [
            {
              name: 'Name',
              type: 'singleLineText',
            },
            {
              name: 'Status',
              type: 'singleSelect',
              options: {
                choices: [
                  { name: 'Todo' },
                  { name: 'In Progress' },
                  { name: 'Done' },
                ],
              },
            },
          ],
        },
      ],
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { workspace_id, name, tables } = propsValue;

    return await airtableCommon.createBase({
      personalToken: auth.secret_text,
      workspaceId: workspace_id,
      name,
      tables: tables as unknown as AirtableTableConfig[],
    });
  },
});
