import { createAction } from '@activepieces/pieces-framework';
import { smartsheetAuth } from '../..';
import { smartsheetCommon } from '../common';
import { httpClient, HttpRequest, HttpMethod } from '@activepieces/pieces-common';

export const deleteRow = createAction({
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

    try {
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      if (error?.response?.status === 400) {
        throw new Error('Bad request. Please check the sheet and row IDs.');
      } else if (error?.response?.status === 403) {
        throw new Error('Forbidden: You do not have permission to delete this row.');
      } else if (error?.response?.status === 404) {
        throw new Error('Row not found. Please verify the row ID.');
      } else if (error?.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error(`Failed to delete row: ${error?.message || error}`);
    }
  },
});
