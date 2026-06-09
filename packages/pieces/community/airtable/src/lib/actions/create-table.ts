import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableAuth } from '../auth';
import { airtableCommon } from '../common';
import { AirtableFieldConfig } from '../common/models';

export const airtableCreateTableAction = createAction({
  auth: airtableAuth,
  name: 'airtable_create_table',
  displayName: 'Create Table',
  description: 'Create a new table in an existing base.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new table in an existing base from a JSON array of field definitions (the first field becomes the primary field), with an optional table description. Use to add a table to a base you already have. Not idempotent — each call creates a new table.',
    idempotent: false,
  },
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
        'A JSON array of fields for the new table. The first field in the array will become the primary field.',
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
    const { auth: personalToken, propsValue } = context;
    const { base: baseId, name, description, fields } = propsValue;

    return await airtableCommon.createTable({
      personalToken: personalToken.secret_text,
      baseId: baseId as string,
      name: name as string,
      description: description as string | undefined,
      fields: fields as unknown as AirtableFieldConfig[],
    });
  },
});