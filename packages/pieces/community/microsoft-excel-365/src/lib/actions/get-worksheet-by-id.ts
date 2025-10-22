import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { excelAuth } from '../../index';
import { excelCommon } from '../common/common';

export const getWorksheetAction = createAction({
    auth: excelAuth,
    name: 'get_worksheet',
    displayName: 'Get Worksheet by ID',
    description: 'Retrieve metadata of a worksheet by its ID.',
    props: {
        workbook_id: excelCommon.workbook_id,
        worksheet_id: excelCommon.worksheet_id, // This dropdown provides the worksheet name as its value
    },
    async run(context) {
        const { workbook_id, worksheet_id } = context.propsValue;
        const { access_token } = context.auth;

        // The worksheet_id prop from excelCommon returns the worksheet's name,
        // which can be used to identify it in the API URL as per the documentation ({id|name}).
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${excelCommon.baseUrl}/items/${workbook_id}/workbook/worksheets/${worksheet_id}`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: access_token,
            },
        });

        // The response body contains the workbookWorksheet object with its metadata.
        return response.body;
    },
});