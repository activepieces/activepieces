import { createAction, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { excelAuth } from '../auth';
import { commonProps } from "../common/props";
import { getDrivePath, createMSGraphClient } from "../common/helpers";

export const getWorksheetColumnsAction = createAction({
    displayName: 'Get Worksheet Columns',
    name: 'get-worksheet-columns',
    description: 'List columns of a worksheet.',
    audience: 'both',
    aiMetadata: { description: 'List the header/column values from the first row of a worksheet (read from the used range across A1:ZZ1). Pick this to inspect loose-cell sheet headers before appending or mapping rows. Use Get Table Columns instead when the data is a formal Excel table. Read-only and idempotent.', idempotent: true },
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
        const cloud = (context.auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

        if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
            throw new Error('please select SharePoint site and document library.');
        }
        const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

        const client = createMSGraphClient(context.auth.access_token, cloud);
        const response = await client
            .api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='A1:ZZ1')/usedRange`)
            .get();

        const columns = response.values?.[0] ?? [];

        return columns;

    }
})