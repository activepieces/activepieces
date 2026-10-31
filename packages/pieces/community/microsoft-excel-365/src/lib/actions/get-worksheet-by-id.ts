import { createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

export const getWorksheetAction = createAction({
    auth: excelAuth,
    name: 'get_worksheet',
    classification: 'READ',
    displayName: 'Get Worksheet',
    description: "Retrieve a worksheet's details.",
    audience: 'both',
    aiMetadata: { description: 'Fetch a single worksheet by its id (or name), returning that sheet metadata such as id, name, position, and visibility. Use when you already know which sheet you want; to list all sheets use Get Worksheets, or to search by name use Find Worksheet. Read-only and idempotent.', idempotent: true },
    propertyGroups: [
        {
            key: 'workbook',
            display: 'section',
            label: 'Workbook',
            icon: 'file',
            props: ['storageSource', 'siteId', 'documentId', 'workbookId', 'worksheetId'],
        },
    ],
    props: {
        storageSource: commonProps.storageSource,
        siteId: commonProps.siteId,
        documentId: commonProps.documentId,
        workbookId: commonProps.workbookId,
        worksheetId: commonProps.worksheetId,
    },
    async run(context) {
        const { storageSource, siteId, documentId, workbookId, worksheetId } = context.propsValue;
        const { access_token } = context.auth;
        const cloud = (context.auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

        if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
            throw new Error('please select SharePoint site and document library.');
        }
        const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

        const client = createMSGraphClient(access_token, cloud);
        const response = await client
            .api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}`)
            .get();

        return response;
    },
});
