import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { excelAuth } from '../../index';
import { excelCommon } from '../common/common';

export const getCellsInRange = createAction({
    auth: excelAuth,
    name: 'getCellsInRange',
    displayName: 'Get Cells in Range',
    description: 'Retrieve the values in a given cell range (e.g., “A1:C10”).',
    props: {
        workbook_id: excelCommon.workbook_id,
        worksheet_id: excelCommon.worksheet_id,
        range: Property.ShortText({
            displayName: 'Range',
            description: 'The range of cells to retrieve, in A1 notation (e.g., "A1:C10").',
            required: true,
        }),
    },
    async run(context) {
        const { workbook_id, worksheet_id, range } = context.propsValue;
        const { access_token } = context.auth;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${excelCommon.baseUrl}/items/${workbook_id}/workbook/worksheets/${worksheet_id}/range(address='${range}')`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: access_token,
            },
        });


        return response.body;
    },
});