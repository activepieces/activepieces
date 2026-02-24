import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import {
  createAction,
  DynamicPropsValue,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { excelAuth } from '../../index';
import { excelCommon } from '../common/common';

export const appendMultipleRowsAction = createAction({
  auth: excelAuth,
  name: 'append_multiple_rows',
  description: 'Appends multiple row of values to a worksheet.',
  displayName: 'Append Multiple Rows',
  props: {
    workbook_id: excelCommon.workbook_id,
    worksheet_id: excelCommon.worksheet_id,
    values: Property.DynamicProperties({
      auth: excelAuth,
      displayName: 'Values',
      required: true,
      refreshers: ['workbook_id', 'worksheet_id'],
      props: async ({ auth, workbook_id, worksheet_id }) => {
        if (
          !auth ||
          (workbook_id ?? '').toString().length === 0 ||
          (worksheet_id ?? '').toString().length === 0
        ) {
          return {};
        }

        const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;

        const firstRow = await excelCommon.getHeaders(
          workbook_id as unknown as string,
          authProp['access_token'],
          worksheet_id as unknown as string
        );

        const fields: DynamicPropsValue = {};

        const columns: {
          [key: string]: any;
        } = {};
        for (const key in firstRow) {
          columns[key] = Property.ShortText({
            displayName: firstRow[key].toString(),
            description: firstRow[key].toString(),
            required: false,
            defaultValue: '',
          });
        }

        fields['values'] = Property.Array({
          displayName: 'Values',
          required: true,
          properties: columns,
        });

        return fields;
      },
    }),
  },
  async run({ propsValue, auth }) {
    const workbookId = propsValue['workbook_id'];
    const worksheetId = propsValue['worksheet_id'];

    const inputValues: Array<Record<string, any>> =
      propsValue.values['values'] ?? [];

    const firstRow = await excelCommon.getHeaders(
      workbookId as string,
      auth.access_token,
      worksheetId as string
    );

    const columnCount = firstRow.length;

    const formattedValues = inputValues.map((v) =>
      Array.from({ length: columnCount }, (_, i) => v[i] ?? null)
    );

    const lastUsedRow = await excelCommon.getLastUsedRow(
      workbookId,
      worksheetId,
      auth['access_token']
    );

    const lastUsedColumn = excelCommon.numberToColumnName(columnCount);

    const rangeFrom = `A${lastUsedRow + 1}`;
    const rangeTo = `${lastUsedColumn}${lastUsedRow + formattedValues.length}`;

    const url = `${excelCommon.baseUrl}/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='${rangeFrom}:${rangeTo}')`;

    const requestBody = {
      values: formattedValues,
    };

    const request: HttpRequest = {
      method: HttpMethod.PATCH,
      url: url,
      body: requestBody,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth['access_token'],
      },
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
});
