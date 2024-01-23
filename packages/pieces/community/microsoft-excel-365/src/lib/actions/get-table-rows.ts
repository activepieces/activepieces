import { createAction, Property } from '@activepieces/pieces-framework';
import { excelCommon } from '../common/common';
import { excelAuth } from '../..';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const getTableRowsAction = createAction({
  auth: excelAuth,
  name: 'get_table_rows',
  description: 'List rows of a table in a worksheet',
  displayName: 'Get Table Rows',
  props: {
    workbook_id: excelCommon.workbook_id,
    worksheet_id: excelCommon.worksheet_id,
    table: excelCommon.table_id,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Limit the number of rows retrieved',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const workbookId = propsValue['workbook_id'];
    const worksheetId = propsValue['worksheet_id'];
    const tableId = propsValue['table'];
    const limit = propsValue['limit'];

    let url = `${excelCommon.baseUrl}/items/${workbookId}/workbook/worksheets/${worksheetId}/tables/${tableId}/rows`;

    if (limit) {
      url += `?$top=${limit}`;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth['access_token'],
      },
    });

    const rowsValues = response.body['value'].map(
      (row: { values: any[] }) => row.values[0]
    );

    return rowsValues;
  },
});
