import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType
} from '@activepieces/pieces-common';
import { excelAuth } from '../../index';
import { excelCommon } from '../common/common';

export const clearRangeAction = createAction({
  auth: excelAuth,
  name: 'clear_range',
  displayName: 'Clear Cells by Range',
  description: 'Clear a block of cells (range) content or formatting.',
  props: {
    workbook_id: excelCommon.workbook_id,
    worksheet_id: excelCommon.worksheet_id,
    range: Property.ShortText({
      displayName: 'Range',
      description:
        'The range of cells to clear, in A1 notation (e.g., "A1:C5").',
      required: true
    }),
    applyTo: Property.StaticDropdown({
      displayName: 'Clear Type',
      description: 'Specify what to clear from the range.',
      required: true,
      defaultValue: 'All',
      options: {
        options: [
          {
            label: 'All (Contents and Formatting)',
            value: 'All'
          },
          {
            label: 'Contents Only',
            value: 'Contents'
          },
          {
            label: 'Formats Only',
            value: 'Formats'
          }
        ]
      }
    })
  },
  async run(context) {
    const { workbook_id, worksheet_id, range, applyTo } = context.propsValue;
    const { access_token } = context.auth;
    
    if (!/^[A-Z]+[1-9][0-9]*(:[A-Z]+[1-9][0-9]*)?$/.test(range as string)) {
        throw new Error('Invalid range format. Please use A1 notation (e.g., "A1" or "A1:C5").');
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${excelCommon.baseUrl}/items/${workbook_id}/workbook/worksheets/${worksheet_id}/range(address='${range}')/clear`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: access_token
      },
      body: {
        applyTo: applyTo
      }
    });

    // A successful request returns a 200 OK with no body.
    return response.body;
  }
});
