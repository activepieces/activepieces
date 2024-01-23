import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { excelAuth } from '../../index';
import { excelCommon } from '../common/common';

export const clearWorksheetAction = createAction({
  auth: excelAuth,
  name: 'clear_worksheet',
  description: 'Clear a worksheet',
  displayName: 'Clear Worksheet',
  props: {
    workbook_id: excelCommon.workbook_id,
    worksheet_id: excelCommon.worksheet_id,
    range: Property.ShortText({
      displayName: 'Range',
      description:
        'The range in A1 notation (e.g., A2:B2) to clear in the worksheet, if not provided, clear the entire worksheet',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const workbookId = propsValue['workbook_id'];
    const worksheetId = propsValue['worksheet_id'];
    const range = propsValue['range'];

    let url = `${excelCommon.baseUrl}/items/${workbookId}/workbook/worksheets/${worksheetId}/`;

    // If range is not provided, clear the entire worksheet
    if (!range) {
      url += 'usedRange(valuesOnly=true)/clear';
    } else {
      url += `range(address = '${range}')/clear`;
    }

    const request = {
      method: HttpMethod.POST,
      url: url,
      body: {
        applyTo: 'contents',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN as const,
        token: auth['access_token'],
      },
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
});
