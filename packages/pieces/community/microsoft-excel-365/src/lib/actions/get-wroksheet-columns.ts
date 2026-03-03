import { createAction } from "@activepieces/pieces-framework";
import { excelAuth } from '../auth';
import { commonProps } from "../common/props";
import { getDrivePath } from "../common/helpers";
import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";

export const getWorksheetColumnsAction = createAction({
    displayName: 'Get Worksheet Columns',
    name: 'get-worksheet-columns',
    description: 'List columns of a worksheet.',
    auth: excelAuth,
    props: {
        storageSource: commonProps.storageSource,
        siteId: commonProps.siteId,
        documentId: commonProps.documentId,
        workbookId: commonProps.workbookId,
        worksheetId: commonProps.worksheetId,
    },
    async run(context) {
        const { storageSource, siteId, documentId, workbookId, worksheetId } = context.propsValue;

        if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
            throw new Error('please select SharePoint site and document library.');
        }
        const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

        const response = await httpClient.sendRequest<{ values: Array<Array<string>> }>({
            method: HttpMethod.GET,
            url: `${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='A1:ZZ1')/usedRange`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token
            }
        });

        const columns = response.body.values?.[0] ?? []

        return columns;

    }
})