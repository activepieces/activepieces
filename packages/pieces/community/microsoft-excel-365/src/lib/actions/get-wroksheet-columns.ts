import { createAction } from "@activepieces/pieces-framework";
import { excelAuth } from "../..";
import { excelCommon } from "../common/common";
import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";

export const getWorksheetColumnsAction = createAction({
    displayName: 'Get Worksheet Columns',
    name: 'get-worksheet-columns',
    description: 'List columns of a worksheet.',
    auth: excelAuth,
    props: {
        workbook_id: excelCommon.workbook_id,
        worksheet_id: excelCommon.worksheet_id,
    },
    async run(context) {
        const { workbook_id, worksheet_id } = context.propsValue;

        const response = await httpClient.sendRequest<{ values: Array<Array<string>> }>({
            method: HttpMethod.GET,
            url: `${excelCommon.baseUrl}/items/${workbook_id}/workbook/worksheets/${worksheet_id}/range(address='A1:ZZ1')/usedRange`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token
            }
        });

        const columns = response.body.values?.[0] ?? []

        return columns;

    }
})