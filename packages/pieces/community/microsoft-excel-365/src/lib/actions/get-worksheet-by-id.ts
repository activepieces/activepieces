import { createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

export const getWorksheetAction = createAction({
    auth: excelAuth,
    name: 'get_worksheet',
    displayName: 'Get Worksheet by ID',
    description: 'Retrieve metadata of a worksheet by its ID.',
    props: {
        storageSource: commonProps.storageSource,
        siteId: commonProps.siteId,
        documentId: commonProps.documentId,
        workbookId: commonProps.workbookId,
        worksheetId: commonProps.worksheetId, // This dropdown provides the worksheet name as its value
    },
    async run(context) {
        const { storageSource, siteId, documentId, workbookId, worksheetId } = context.propsValue;
        const { access_token } = context.auth;
        const cloud = (context.auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

        if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
            throw new Error('please select SharePoint site and document library.');
        }
        const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

        // The worksheet_id prop from excelCommon returns the worksheet's name,
        // which can be used to identify it in the API URL as per the documentation ({id|name}).
        const client = createMSGraphClient(access_token, cloud);
        const response = await client
            .api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}`)
            .get();

        // The response body contains the workbookWorksheet object with its metadata.
        return response;
    },
});