import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableAuth } from '../auth';
import { airtableCommon } from '../common';
import { AirtableTableConfig } from '../common/models';

export const airtableCreateBaseAction = createAction({
  auth: airtableAuth,
  name: 'airtable_create_base',
  displayName: 'Create Base',
  description: 'Create a new base with a specified table structure.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new Airtable base inside a workspace, seeded with one or more tables defined by a JSON structure (the first field of each table becomes its primary field). Use to provision a brand-new base. Requires a workspace ID and base name; not idempotent — each call creates a separate base.',
    idempotent: false,
  },
  props: {
    workspaceId: airtableCommon.workspaceId,
    name: Property.ShortText({
      displayName: 'Base Name',
      description: 'The name for the new base.',
      required: true,
    }),
    tables: Property.Json({
      displayName: 'Tables',
      description:
        'Define the tables for the new base. Use the default value as a template. The first field for each table will be its primary field.',
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
    const { auth: personalToken, propsValue } = context;
    const { workspaceId, name, tables } = propsValue;

    return await airtableCommon.createBase({
      personalToken: personalToken.secret_text,
      workspaceId: workspaceId as string,
      name: name as string,
      tables: tables as unknown as AirtableTableConfig[],
    });
  },
});