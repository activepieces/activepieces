import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { excelAuth } from '../../index';
import { excelCommon } from '../common/common';

export const clearColumnAction = createAction({
    auth: excelAuth,
    name: 'clear_column',
    displayName: 'Clear Column by Index',
    description: 'Clear contents/formatting of a column by its index.',
    props: {
        workbook_id: excelCommon.workbook_id,
        worksheet_id: excelCommon.worksheet_id,
        column_index: Property.Number({
            displayName: 'Column Index',
            description: 'The 1-based index of the column to be cleared (e.g., 1 for column A, 2 for column B).',
            required: true,
        }),
        applyTo: Property.StaticDropdown({
            displayName: "Clear Type",
            description: "Specify what to clear from the column.",
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
        const { workbook_id, worksheet_id, column_index, applyTo } = context.propsValue;
        const { access_token } = context.auth;

        // Convert 1-based index to Excel column letter (e.g., 1 -> 'A')
        const columnLetter = excelCommon.numberToColumnName(column_index);

        // Construct the range address for the entire column, e.g., 'C:C'
        const columnAddress = `${columnLetter}:${columnLetter}`;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${excelCommon.baseUrl}/items/${workbook_id}/workbook/worksheets/${worksheet_id}/range(address='${columnAddress}')/clear`,
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