import {
  DynamicPropsValue,
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { APITableCommon, createNewFields, makeClient } from '../common';
import { APITableAuth } from '../../index';

export const updateRecordAction = createAction({
  auth: APITableAuth,
  name: 'apitable_update_record',
  displayName: 'Update Record',
  description: 'Updates an existing record in datasheet.',
  props: {
    space_id: APITableCommon.space_id,
    datasheet_id: APITableCommon.datasheet_id,
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'The ID of the record to update.',
      required: true,
    }),
    fields: APITableCommon.fields,
  },
  async run(context) {
    const auth = context.auth;
    const datasheetId = context.propsValue.datasheet_id;
    const recordId = context.propsValue.recordId;
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
      auth as PiecePropValueSchema<typeof APITableAuth>,
      datasheetId,
      fields
    );

    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof APITableAuth>
    );

    const response: any = await client.updateRecord(datasheetId as string, {
      records: [
        {
          recordId: recordId,
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
