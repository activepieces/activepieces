import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableAuth } from '../../index';
import { airtableCommon } from '../common';
import { AirtableTableConfig } from '../common/models';

export const airtableCreateBaseAction = createAction({
  auth: airtableAuth,
  name: 'airtable_create_base',
  displayName: 'Create Base',
  description: 'Creates a new base (workspace database).',
  props: {
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      description:
        'You can find the Workspace ID in the URL of your workspace home (it starts with `wsp`).',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Base Name',
      description: 'The name for the new base.',
      required: true,
    }),
    tables: Property.Json({
      displayName: 'Tables Configuration',
      description:
        'A JSON array defining the tables and fields for the new base.',
      required: true,
      defaultValue: [
        {
          name: 'My First Table',
          description: 'A brief description of this table.',
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
    const personalToken = context.auth;
    const { workspaceId, name, tables } = context.propsValue;

    return await airtableCommon.createBase({
      personalToken,
      workspaceId: workspaceId as string,
      name: name as string,
      tables: tables as unknown as AirtableTableConfig[],
    });
  },
});
