import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

export const deleteRowAction = createAction({
    auth: excelAuth,
    name: 'delete_row',
    displayName: 'Delete Row',
    description: 'Delete an entire row from a worksheet by its row number.',
    props: {
        storageSource: commonProps.storageSource,
        siteId: commonProps.siteId,
        documentId: commonProps.documentId,
        workbookId: commonProps.workbookId,
        worksheetId: commonProps.worksheetId,
        row_id: Property.Number({
            displayName: 'Row Number',
            description: 'The number of the row to delete (e.g., 5 to delete the 5th row). Rows below will shift up.',
            required: true,
        }),
    },
    async run(context) {
        const { storageSource, siteId, documentId, workbookId, worksheetId, row_id } = context.propsValue;
        const { access_token } = context.auth;
        const cloud = (context.auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

        if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
            throw new Error('Please select a SharePoint site and document library.');
        }

        if (typeof row_id !== 'number' || !Number.isInteger(row_id) || row_id < 1) {
            throw new Error('Row number must be a positive integer.');
        }

        const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);
        const rowAddress = `${row_id}:${row_id}`;

        const client = createMSGraphClient(access_token, cloud);
        await client
            .api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='${rowAddress}')/delete`)
            .post({ shift: 'Up' });

        return { success: true, deleted_row: row_id };
    },
});
