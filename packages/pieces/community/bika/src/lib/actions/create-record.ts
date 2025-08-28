import {
  DynamicPropsValue,
  PiecePropValueSchema,
  createAction,
} from '@activepieces/pieces-framework';
import { BikaCommon, createNewFields, makeClient } from '../common';
import { BikaAuth } from '../../index';

export const createRecordAction = createAction({
  auth: BikaAuth,
  name: 'bika_create_record',
  displayName: 'Create Record',
  description: 'Creates a new record in datasheet.',
  props: {
    space_id: BikaCommon.space_id,
    datasheet_id: BikaCommon.datasheet_id,
    fields: BikaCommon.fields,
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
      auth as PiecePropValueSchema<typeof BikaAuth>,
      datasheetId,
      fields
    );

    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof BikaAuth>
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
