import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { excelCommon } from '../common/common';
import { excelAuth } from '../../index';

export const getWorksheetRowsAction = createAction({
  auth: excelAuth,
  name: 'get_worksheet_rows',
  description: 'Retrieve rows from a worksheet',
  displayName: 'Get Worksheet Rows',
  props: {
    workbook_id: excelCommon.workbook_id,
    worksheet_id: excelCommon.worksheet_id,
    range: Property.ShortText({
      displayName: 'Range',
      description: 'Range of the rows to retrieve (e.g., A2:B2)',
      required: false,
    }),
    headerRow: Property.Number({
      displayName: 'Header Row',
      description: 'Row number of the header',
      required: false,
    }),
    firstDataRow: Property.Number({
      displayName: 'First Data Row',
      description: 'Row number of the first data row',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const workbookId = propsValue['workbook_id'];
    const worksheetId = propsValue['worksheet_id'];
    const range = propsValue['range'];
    const headerRow = propsValue['headerRow'];
    const firstDataRow = propsValue['firstDataRow'];

    let url = `${excelCommon.baseUrl}/items/${workbookId}/workbook/worksheets/${worksheetId}/`;

    if (!range) {
      url += 'usedRange(valuesOnly=true)';
    } else {
      url += `range(address = '${range}')`;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth['access_token'],
      },
    });

    const rows = response.body['values'];
    if (headerRow && firstDataRow) {
      return rows.slice(firstDataRow - 1).map((row: any[]) => {
        const obj: { [key: string]: any } = {};
        rows[headerRow - 1].forEach(
          (header: any, colIndex: string | number) => {
            obj[String(header)] = row[Number(colIndex)];
          }
        );
        return obj;
      });
    }

    return rows;
  },
});
