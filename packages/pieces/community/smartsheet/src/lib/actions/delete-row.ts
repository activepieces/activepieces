import { createAction } from '@activepieces/pieces-framework';
import { smartsheetAuth } from '../..';
import { smartsheetCommon } from '../common';
import { httpClient, HttpRequest, HttpMethod } from '@activepieces/pieces-common';

export const deleteRowAction = createAction({
  auth: smartsheetAuth,
  name: 'smartsheet_delete_row',
  displayName: 'Delete Row',
  description: 'Delete a row from a Smartsheet',
  props: {
    sheet_id: smartsheetCommon.sheet_id(true),
    row_id: smartsheetCommon.row_id,
  },
  async run(context) {
    const accessToken = context.auth.secret_text;
    const { sheet_id, row_id } = context.propsValue;

    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `${smartsheetCommon.baseUrl}/sheets/${sheet_id}/rows?ids=${row_id}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
});
