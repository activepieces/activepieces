import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { excelAuth } from '../../index';
import { excelCommon } from '../common/common';

export const getWorksheetsAction = createAction({
  auth: excelAuth,
  name: 'get_worksheets',
  description: 'Retrieve worksheets from a workbook',
  displayName: 'Get Worksheets',
  props: {
    workbook: excelCommon.workbook_id,
    returnAll: Property.Checkbox({
      displayName: 'Return All',
      description: 'If checked, all worksheets will be returned',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Limit the number of worksheets returned',
      required: false,
      defaultValue: 10,
    }),
  },
  async run({ propsValue, auth }) {
    const workbookId = propsValue['workbook'];
    const returnAll = propsValue['returnAll'];
    const limit = propsValue['limit'];

    const endpoint = `${excelCommon.baseUrl}/items/${workbookId}/workbook/worksheets`;
    const headers = {
      Authorization: `Bearer ${auth['access_token']}`,
      'Content-Type': 'application/json',
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: endpoint,
      headers: headers,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to retrieve worksheet: ${response.body}`);
    }

    const worksheets = response.body['value'];

    if (returnAll) {
      return worksheets;
    } else {
      const limitedWorksheets = [];
      for (let i = 0; i < Math.min(worksheets['length'], limit ?? 0); i++) {
        limitedWorksheets.push(worksheets[i]);
      }
      return limitedWorksheets;
    }
  },
});
