import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { excelAuth } from '../../index';
import { excelCommon } from '../common/common';

export const getRowAction = createAction({
    auth: excelAuth,
    name: 'get_row',
    displayName: 'Get Row by ID',
    description: 'Retrieve the entire content of a row by its row ID.',
    props: {
        workbook_id: excelCommon.workbook_id,
        worksheet_id: excelCommon.worksheet_id,
        table_id: excelCommon.table_id,
        row_id: Property.Number({
            displayName: 'Row ID (Index)',
            description: 'The zero-based index of the row to retrieve (e.g., 0 for the first row, 1 for the second).',
            required: true,
        }),
    },
    async run(context) {
        const { workbook_id, table_id, row_id } = context.propsValue;
        const { access_token } = context.auth;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${excelCommon.baseUrl}/items/${workbook_id}/workbook/tables/${table_id}/rows/${row_id}`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: access_token,
            },
        });

        return response.body;
    },
});