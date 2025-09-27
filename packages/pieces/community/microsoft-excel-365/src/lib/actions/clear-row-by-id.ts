import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { excelAuth } from '../../index';
import { excelCommon } from '../common/common';

export const clearRowAction = createAction({
    auth: excelAuth,
    name: 'clear_row',
    displayName: 'Clear Row by ID',
    description: 'Clear contents/formatting of an entire row by its ID.',
    props: {
        workbook_id: excelCommon.workbook_id,
        worksheet_id: excelCommon.worksheet_id,
        row_id: Property.Number({
            displayName: 'Row Number',
            description: 'The number of the row to be cleared (e.g., 5 for the 5th row).',
            required: true,
        }),
        applyTo: Property.StaticDropdown({
            displayName: "Clear Type",
            description: "Specify what to clear from the row.",
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
        const { workbook_id, worksheet_id, row_id, applyTo } = context.propsValue;
        const { access_token } = context.auth;

        // Construct the range address for the entire row, e.g., '5:5'
        const rowAddress = `${row_id}:${row_id}`;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${excelCommon.baseUrl}/items/${workbook_id}/workbook/worksheets/${worksheet_id}/range(address='${rowAddress}')/clear`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: access_token,
            },
            body: {
                applyTo: applyTo,
            },
        });

        // A successful request returns a 200 OK with no body.
        return response.body;
    },
});