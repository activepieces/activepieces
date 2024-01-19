import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { excelAuth } from '../../index';
import { excelCommon } from '../common/common';

export const deleteWorksheetAction = createAction({
  auth: excelAuth,
  name: 'delete_worksheet',
  description: 'Delete a worksheet in a workbook',
  displayName: 'Delete Worksheet',
  props: {
    workbook_id: excelCommon.workbook_id,
    worksheet_id: excelCommon.worksheet_id,
  },
  async run({ propsValue, auth }) {
    const workbookId = propsValue['workbook_id'];
    const worksheetId = propsValue['worksheet_id'];

    const request = {
      method: HttpMethod.DELETE,
      url: `${excelCommon.baseUrl}/items/${workbookId}/workbook/worksheets/${worksheetId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN as const,
        token: auth['access_token'],
      },
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
});
