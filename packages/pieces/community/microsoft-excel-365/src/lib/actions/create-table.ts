import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { excelAuth } from '../../index';
import { excelCommon } from '../common/common';

export const createTableAction = createAction({
  auth: excelAuth,
  name: 'create_table',
  description: 'Create a table in a worksheet',
  displayName: 'Create Table',
  props: {
    workbook_id: excelCommon.workbook_id,
    worksheet_id: excelCommon.worksheet_id,
    selectRange: Property.Dropdown({
      displayName: 'Select Range',
      description: 'How to select the range for the table',
      required: true,
      options: async () => {
        return {
          disabled: false,
          options: [
            {
              label: 'Automatically',
              value: 'auto',
            },
            {
              label: 'Manually',
              value: 'manual',
            },
          ],
          defaultValue: 'auto',
        };
      },
      refreshers: [],
    }),
    range: Property.ShortText({
      displayName: 'Range',
      description:
        'The range of cells in A1 notation (e.g., A2:B2) that will be converted to a table',
      required: false,
      defaultValue: 'A1:B2',
    }),
    hasHeaders: Property.Checkbox({
      displayName: 'Has Headers',
      description: 'Whether the range has column labels',
      required: true,
      defaultValue: true,
    }),
  },
  async run({ propsValue, auth }) {
    const workbookId = propsValue['workbook_id'];
    const worksheetId = propsValue['worksheet_id'];
    const selectRange = propsValue['selectRange'];
    const hasHeaders = propsValue['hasHeaders'];

    let range: string | undefined;
    if (selectRange === 'auto') {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${excelCommon.baseUrl}/items/${workbookId}/workbook/worksheets/${worksheetId}/usedRange`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth['access_token'],
        },
        queryParams: {
          select: 'address',
        },
      });
      range = response.body['address'].split('!')[1];
    } else {
      range = propsValue['range'];
    }

    const result = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${excelCommon.baseUrl}/items/${workbookId}/workbook/worksheets/${worksheetId}/tables/add`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth['access_token'],
      },
      body: {
        address: range,
        hasHeaders,
      },
    });

    return result.body;
  },
});
