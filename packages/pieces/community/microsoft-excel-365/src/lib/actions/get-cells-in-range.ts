import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType
} from '@activepieces/pieces-common';
import { excelAuth } from '../../index';
import { excelCommon } from '../common/common';

export const getRangeAction = createAction({
  auth: excelAuth,
  name: 'get_range',
  displayName: 'Get Cells in Range',
  description: 'Retrieve the values in a given cell range (e.g., “A1:C10”).',
  props: {
    workbook_id: excelCommon.workbook_id,
    worksheet_id: excelCommon.worksheet_id,
    range: Property.ShortText({
      displayName: 'Range',
      description:
        'The range of cells to retrieve, in A1 notation (e.g., "A1:C10").',
      required: true
    })
  },
  async run(context) {
    const { workbook_id, worksheet_id, range } = context.propsValue;
    const { access_token } = context.auth;

    if (!/^[A-Z]+[1-9][0-9]*(:[A-Z]+[1-9][0-9]*)?$/.test(range as string)) {
      throw new Error(
        'Invalid range format. Please use A1 notation (e.g., "A1" or "A1:C5").'
      );
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${excelCommon.baseUrl}/items/${workbook_id}/workbook/worksheets/${worksheet_id}/range(address='${range}')`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: access_token
      }
    });

    // The response body contains the workbookRange object with details
    // like values, text, formulas, rowCount, etc.
    return response.body;
  }
});
