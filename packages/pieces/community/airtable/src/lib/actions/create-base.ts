import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableCommon } from '../common';
import { airtableAuth } from '../../index';
import { AirtableCreateBaseRequest } from '../common/models';

export const airtableCreateBaseAction = createAction({
  auth: airtableAuth,
  name: 'airtable_create_base',
  displayName: 'Create Airtable Base',
  description: 'Creates a new base (workspace database) in Airtable',
  props: {
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'The ID of the workspace where the new base should be created',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Base Name',
      description: 'Name for the new base',
      required: true,
    }),
    tables: Property.Json({
      displayName: 'Tables',
      description:
        'A JSON array of tables to create in the new base. At least one table and one field are required.',
      required: true,
      defaultValue: [
        {
          name: 'Test Table',
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
    const personalToken = context.auth as string;
    const { workspaceId, name, tables } = context.propsValue;

    const createBaseReq: AirtableCreateBaseRequest = {
      personalToken,
      workspaceId,
      name,
      tables: tables as unknown as any[] | undefined, 
    };

    return await airtableCommon.createBase(createBaseReq);
  },
});
