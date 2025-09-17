import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableCommon } from '../common';
import { airtableAuth } from '../../index';
import { AirtableCreateTableRequest, AirtableFieldSpec } from '../common/models';

export const airtableCreateTableAction = createAction({
  auth: airtableAuth,
  name: 'airtable_create_table',
  displayName: 'Create Airtable Table',
  description: 'Creates a new table in an existing Airtable base',
  props: {
    baseId: Property.ShortText({
      displayName: 'Base ID',
      description: 'The ID of the base where the new table will be created',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Table Name',
      description: 'The name of the new table',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Optional description of the table',
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
    const personalToken = context.auth as string;
    const { baseId, name, description, fields } = context.propsValue;

    if (!Array.isArray(fields) || fields.length === 0) {
      throw new Error('Fields array cannot be empty');
    }

    const primaryField = fields[0] as AirtableFieldSpec;
    const otherFields = fields.slice(1) as AirtableFieldSpec[];

    const req: AirtableCreateTableRequest = {
      personalToken,
      baseId,
      name,
      description,
      primaryFieldName: primaryField.name,
      primaryFieldType: primaryField.type,
      fields: otherFields,
    };

    return await airtableCommon.createTable(req);
  },
});
