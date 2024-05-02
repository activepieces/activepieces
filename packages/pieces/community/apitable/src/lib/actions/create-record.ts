import {
  DynamicPropsValue,
  PiecePropValueSchema,
  createAction,
} from '@activepieces/pieces-framework';
import { APITableCommon, createNewFields, makeClient } from '../common';
import { APITableAuth } from '../../index';

export const createRecordAction = createAction({
  auth: APITableAuth,
  name: 'apitable_create_record',
  displayName: 'Create Record',
  description: 'Creates a new record in datasheet.',
  props: {
    space_id: APITableCommon.space_id,
    datasheet_id: APITableCommon.datasheet_id,
    fields: APITableCommon.fields,
  },
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
      auth as PiecePropValueSchema<typeof APITableAuth>,
      datasheetId,
      fields
    );

    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof APITableAuth>
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
