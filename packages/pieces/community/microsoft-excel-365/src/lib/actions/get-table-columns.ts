import { createAction, Property } from '@activepieces/pieces-framework';
import { excelCommon } from '../common/common';
import { excelAuth } from '../..';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const getTableColumnsAction = createAction({
  auth: excelAuth,
  name: 'get_table_columns',
  description: 'List columns of a table in a worksheet',
  displayName: 'Get Table Columns',
  props: {
    workbook_id: excelCommon.workbook_id,
    worksheet_id: excelCommon.worksheet_id,
    table: excelCommon.table_id,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Limit the number of columns retrieved',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const workbookId = propsValue['workbook_id'];
    const worksheetId = propsValue['worksheet_id'];
    const tableId = propsValue['table'];
    const limit = propsValue['limit'];

    let url = `${excelCommon.baseUrl}/items/${workbookId}/workbook/worksheets/${worksheetId}/tables/${tableId}/columns`;

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

    const columnNames = response.body['value'].map(
      (column: { name: any }) => column.name
    );

    return columnNames;
  },
});
