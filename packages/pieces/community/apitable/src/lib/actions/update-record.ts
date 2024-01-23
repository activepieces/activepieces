import {
  DynamicPropsValue, PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { APITableCommon, createNewFields } from '../common';
import { APITableAuth } from '../../index';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

export const apiTableUpdateRecord = createAction({
  auth: APITableAuth,
  name: 'apitable_update_record',
  displayName: 'Update APITable Record',
  description: 'updates a record in datasheet.',
  props: {
    datasheet: APITableCommon.datasheet,
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'The ID of the record to update.',
      required: true,
    }),
    fields: APITableCommon.fields,
  },
  async run(context) {
    const auth = context.auth;
    const datasheet = context.propsValue.datasheet;
    const recordId = context.propsValue.recordId;
    const apiTableUrl = auth.apiTableUrl;
    const dynamicFields: DynamicPropsValue = context.propsValue.fields;
    const fields: {
      [n: string]: string;
    } = {};

    const props = Object.entries(dynamicFields);
    for (const [propertyKey, propertyValue] of props) {
      if (propertyValue) {
        fields[propertyKey] = propertyValue;
      }
    }

    const newFields: Record<string, unknown> =
      await createNewFields(auth as PiecePropValueSchema<typeof APITableAuth>, datasheet, fields);

    const request: HttpRequest = {
      method: HttpMethod.PATCH,
      url: `${apiTableUrl.replace(
        /\/$/,
        ''
      )}/fusion/v1/datasheets/${datasheet}/records`,
      headers: {
        Authorization: 'Bearer ' + auth.token,
        'Content-Type': 'application/json',
      },
      body: {
        records: [
          {
            recordId: recordId,
            fields: {
              ...newFields,
            },
          },
        ],
      },
    };

    const res = await httpClient.sendRequest<any>(request);

    return res.body;
  },
});
