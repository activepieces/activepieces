import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableAuth } from '../../index';
import { airtableCommon } from '../common';
import { AirtableTableConfig } from '../common/models';

export const airtableCreateBaseAction = createAction({
  auth: airtableAuth,
  name: 'airtable_create_base',
  displayName: 'Create Base',
  description: 'Create a new base with a specified table structure.',
  props: {
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      description:
        "You can find the Workspace ID by navigating to the workspace's page; the ID starts with 'wsp' in the URL.",
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
        'A JSON array of tables to create in the new base. At least one table and one field are required.',
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
      personalToken,
      workspaceId: workspaceId as string,
      name: name as string,
      tables: tables as unknown as AirtableTableConfig[],
    });
  },
});