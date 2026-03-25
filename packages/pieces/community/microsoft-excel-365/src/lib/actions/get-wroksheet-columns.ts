import { createAction } from "@activepieces/pieces-framework";
import { excelAuth } from '../auth';
import { commonProps } from "../common/props";
import { getDrivePath, createMSGraphClient } from "../common/helpers";

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

        const client = createMSGraphClient(context.auth.access_token);
        const response = await client
            .api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='A1:ZZ1')/usedRange`)
            .get();

        const columns = response.values?.[0] ?? [];

        return columns;

    }
})