import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { excelAuth } from '../../index';
import { excelCommon } from '../common/common';

export const updateRowAction = createAction({
    auth: excelAuth,
    name: 'update_row',
    description: 'Update a row in a worksheet',
    displayName: 'Update Worksheet Rows',
    props: {
        workbook_id: excelCommon.workbook_id,
        worksheet_id: excelCommon.worksheet_id,
        range: Property.ShortText({
            displayName: 'Range',
            description: 'The range to update in A1 notation (e.g., A2:B2)',
            required: true,
        }),
        values: Property.Json({
            displayName: 'Values',
            description: 'The values to update in the specified range in JSON format (e.g. [["Sara","1/2/2006","Berlin"], ["Jean","8/4/2001","Paris"]])',
            required: true,
        }),
    },
    async run({ propsValue, auth }) {
        const { workbook_id, worksheet_id, range, values } = propsValue;

        const requestBody = {
            values: values
        };

        const request = {
            method: HttpMethod.PATCH,
            url: `${excelCommon.baseUrl}/${workbook_id}/workbook/worksheets/${worksheet_id}/range(address='${range}')`,
            body: requestBody,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN as const,
                token: auth['access_token'],
            },
        };

        const response = await httpClient.sendRequest(request);

        return response.body;
    },
});