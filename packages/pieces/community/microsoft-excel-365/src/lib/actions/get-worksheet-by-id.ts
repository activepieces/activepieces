import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath } from '../common/helpers';

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

        if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
            throw new Error('please select SharePoint site and document library.');
        }
        const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

        // The worksheet_id prop from excelCommon returns the worksheet's name,
        // which can be used to identify it in the API URL as per the documentation ({id|name}).
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: access_token,
            },
        });

        // The response body contains the workbookWorksheet object with its metadata.
        return response.body;
    },
});