import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpRequest,
} from '@activepieces/pieces-common';
import { excelAuth } from '../../index';
import { excelCommon } from '../common/common';

export const deleteWorkbookAction = createAction({
  auth: excelAuth,
  name: 'delete_workbook',
  description: 'Delete a workbook',
  displayName: 'Delete Workbook',
  props: {
    workbook_id: excelCommon.workbook_id,
  },
  async run({ propsValue, auth }) {
    const workbookId = propsValue['workbook_id'];
    const accessToken = auth['access_token'];

    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `${excelCommon.baseUrl}/items/${workbookId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
    };

    await httpClient.sendRequest(request);
    return { success: true };
  },
});
