import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType, HttpRequest } from '@activepieces/pieces-common';
import { excelAuth } from '../../index';
import { excelCommon } from '../common/common';

export const appendRowAction = createAction({
    auth: excelAuth,
    name: 'append_rows',
    description: 'Append rows of values to a worksheet',
    displayName: 'Append Rows to Worksheet',
    props: {
        workbook_id: excelCommon.workbook_id,
        worksheet_id: excelCommon.worksheet_id,
        values: Property.Json({
            displayName: 'Values',
            description: 'The values to insert in JSON format (e.g. [["Sara","1/2/2006","Berlin"], ["Jean","8/4/2001","Paris"]])',
            required: true,
        }),
    },
    async run({ propsValue, auth }) {
        const workbookId = propsValue['workbook_id'];
        const worksheetId = propsValue['worksheet_id'];
        const values = propsValue['values'];

        const lastUsedRow = await excelCommon.getLastUsedRow(workbookId, worksheetId, auth['access_token']);
        const lastUserColumn = await excelCommon.getLastUsedColumn(workbookId, worksheetId, auth['access_token']);

        const numberOfRows = Object.values(values).length;

        const rangeFrom = `A${lastUsedRow + 1}`;
        const rangeTo = `${lastUserColumn}${lastUsedRow + numberOfRows}`;

        const url = `${excelCommon.baseUrl}/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='${rangeFrom}:${rangeTo}')`;

        const requestBody = {
            values: values
        };

        const request: HttpRequest = {
            method: HttpMethod.PATCH,
            url: url,
            body: requestBody,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth['access_token'],
            },
            headers: {
                "Content-Type": "application/json"
            }
        };

        const response = await httpClient.sendRequest(request);
        return response.body;
    },
});