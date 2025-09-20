import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableAuth } from '../../index';
import { airtableCommon } from '../common';
import { AirtableFieldConfig } from '../common/models';

export const airtableCreateTableAction = createAction({
  auth: airtableAuth,
  name: 'airtable_create_table',
  displayName: 'Create Table',
  description: 'Creates a new table in an existing base.',
  props: {
    base: airtableCommon.base,
    name: Property.ShortText({
      displayName: 'Table Name',
      description: 'The name for the new table.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'An optional description for the new table.',
      required: false,
    }),
    fields: Property.Json({
      displayName: 'Fields',
      description:
        'A JSON array defining the fields (columns) for the new table.',
      required: true,
      defaultValue: [
        {
          name: 'Name',
          type: 'singleLineText',
          description: 'The primary field for the table.',
        },
        {
          name: 'Status',
          type: 'singleSelect',
          options: {
            choices: [
              { name: 'Todo', color: 'blueBright' },
              { name: 'In Progress', color: 'yellowBright' },
              { name: 'Done', color: 'greenBright' },
            ],
          },
        },
        {
          name: 'Notes',
          type: 'multilineText',
        },
      ],
    }),
  },
  async run(context) {
    const personalToken = context.auth;
    const { base: baseId, name, description, fields } = context.propsValue;

    return await airtableCommon.createTable({
      personalToken,
      baseId: baseId as string,
      name: name as string,
      description: description,
      fieldsConfig: fields as unknown as AirtableFieldConfig[],
    });
  },
});
