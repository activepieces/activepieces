import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { excelAuth } from '../../index';
import { excelCommon } from '../common/common';

export const clearCellsByRange = createAction({
    auth: excelAuth,
    name: 'clearCellsByRange',
    displayName: 'Clear Cells by Range',
    description: 'Clear a block of cells (range) content or formatting.',
    props: {
        workbook_id: excelCommon.workbook_id,
        worksheet_id: excelCommon.worksheet_id,
        range: Property.ShortText({
            displayName: 'Range',
            description: 'The range of cells to clear, in A1 notation (e.g., "A1:C5").',
            required: true,
        }),
        applyTo: Property.StaticDropdown({
            displayName: "Clear Type",
            description: "Specify what to clear from the range.",
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

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${excelCommon.baseUrl}/items/${workbook_id}/workbook/worksheets/${worksheet_id}/range(address='${range}')/clear`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: access_token,
            },
            body: {
                applyTo: applyTo,
            },
        });


        return response.body;
    },
});