import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { excelAuth } from '../..';
import { excelCommon } from '../common/common';

export const appendTableRowsAction = createAction({
  auth: excelAuth,
  name: 'append_table_rows',
  description: 'Append rows to a table',
  displayName: 'Append Rows to a Table',
  props: {
    workbook_id: excelCommon.workbook_id,
    worksheet_id: excelCommon.worksheet_id,
    table_id: excelCommon.table_id,
    values: excelCommon.table_values,
  },
  async run({ propsValue, auth }) {
    const workbookId = propsValue['workbook_id'];
    const worksheetId = propsValue['worksheet_id'];
    const tableId = propsValue['table_id'];
    const valuesToAppend = [Object.values(propsValue['values'])];

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${excelCommon.baseUrl}/items/${workbookId}/workbook/worksheets/${worksheetId}/tables/${tableId}/rows`,
      body: {
        values: valuesToAppend,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth['access_token'],
      },
    });

    return response.body;
  },
});
