import {
  DynamicPropsValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { APITableCommon } from '../common';
import { APITableAuth } from '../../index';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

export const apiTableCreateRecord = createAction({
  auth: APITableAuth,
  name: 'apitable_create_record',
  displayName: 'Create APITable Record',
  description: 'Adds a record into an ApiTable datasheet.',
  props: {
    datasheet: APITableCommon.datasheet,
    fields: APITableCommon.fields,
  },
  async run(context) {
    const auth = context.auth;
    const datasheet = context.propsValue.datasheet;
    const dynamicFields: DynamicPropsValue = context.propsValue.fields;
    const apiTableUrl = auth.apiTableUrl;
    const fields: {
      [n: string]: string;
    } = {};

    const props = Object.entries(dynamicFields);
    for (const [propertyKey, propertyValue] of props) {
      if (propertyValue) {
        fields[propertyKey] = propertyValue;
      }
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
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
            fields: {
              ...fields,
            },
          },
        ],
      },
    };

    const res = await httpClient.sendRequest<any>(request);

    return res.body;
  },
});
