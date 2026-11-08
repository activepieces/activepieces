import {
  DynamicPropsValue,
  MarkdownVariant,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { APITableCommon, createNewFields, makeClient } from '../common';
import { APITableAuth } from '../auth';
import { createRecordActionOutputSchema } from '../output-schemas';

export const createRecordAction = createAction({
  auth: APITableAuth,
  name: 'apitable_create_record',
  classification: 'WRITE',
  displayName: 'Create Record',
  description: 'Creates a new record in a datasheet.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new row in an AITable datasheet from a set of field values. Use when an agent needs to add data to a datasheet; requires the target space and datasheet IDs. Not idempotent: each call appends a new record, so repeating it creates duplicates.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'location',
      display: 'section',
      label: 'Location',
      icon: 'location',
      props: ['space_id', 'datasheet_id'],
    },
    {
      key: 'values',
      display: 'section',
      label: 'Record Values',
      icon: 'text',
      props: ['info', 'fields'],
    },
  ],
  props: {
    space_id: APITableCommon.space_id,
    datasheet_id: APITableCommon.datasheet_id,
    info: Property.MarkDown({
      value:
        'Blank fields are left empty. Some column types, such as attachments and formulas, are not listed.',
      variant: MarkdownVariant.INFO,
    }),
    fields: APITableCommon.fields({
      description: 'Values for the new record. Blank fields are left empty.',
    }),
  },
  outputSchema: createRecordActionOutputSchema,
  async run(context) {
    const auth = context.auth;
    const datasheetId = context.propsValue.datasheet_id;
    const dynamicFields: DynamicPropsValue = context.propsValue.fields;
    const fields: {
      [n: string]: string;
    } = {};

    const props = Object.entries(dynamicFields);
    for (const [propertyKey, propertyValue] of props) {
      if (propertyValue !== undefined && propertyValue !== '') {
        fields[propertyKey] = propertyValue;
      }
    }

    const newFields: Record<string, unknown> = await createNewFields(
      auth.props,
      datasheetId,
      fields
    );

    const client = makeClient(
      context.auth.props
    );
    const response: any = await client.createRecord(datasheetId as string, {
      records: [
        {
          fields: {
            ...newFields,
          },
        },
      ],
    });

    if (!response.success) {
      throw new Error(JSON.stringify(response, undefined, 2));
    }
    return response;
  },
});
