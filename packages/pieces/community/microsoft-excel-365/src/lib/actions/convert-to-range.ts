import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { excelCommon } from '../common/common';
import { excelAuth } from '../../index';

export const convertToRangeAction = createAction({
  auth: excelAuth,
  name: 'convert_to_range',
  description: 'Converts a table to a range',
  displayName: 'Convert to Range',
  props: {
    workbook_id: excelCommon.workbook_id,
    worksheet_id: excelCommon.worksheet_id,
    table_id: excelCommon.table_id,
  },
  async run({ propsValue, auth }) {
    const workbookId = propsValue['workbook_id'];
    const worksheetId = propsValue['worksheet_id'];
    const tableId = propsValue['table_id'];

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${excelCommon.baseUrl}/items/${workbookId}/workbook/worksheets/${worksheetId}/tables/${tableId}/convertToRange`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth['access_token'],
      },
    });

    return response.body;
  },
});
