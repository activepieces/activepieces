import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { excelAuth } from '../../index';
import { excelCommon } from '../common/common';

export const getWorksheetById = createAction({
    auth: excelAuth,
    name: 'getWorksheetById',
    displayName: 'Get Worksheet by ID',
    description: 'Retrieve metadata of a worksheet by its ID.',
    props: {
        workbook_id: excelCommon.workbook_id,
        worksheet_id: excelCommon.worksheet_id, 
    },
    async run(context) {
        const { workbook_id, worksheet_id } = context.propsValue;
        const { access_token } = context.auth;


        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${excelCommon.baseUrl}/items/${workbook_id}/workbook/worksheets/${worksheet_id}`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: access_token,
            },
        });

        return response.body;
    },
});