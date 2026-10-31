import { createAction, MarkdownVariant, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

export const deleteRowAction = createAction({
    auth: excelAuth,
    name: 'delete_row',
    classification: 'DESTRUCTIVE',
    displayName: 'Delete Row',
    description: 'Delete a worksheet row. Rows below move up.',
    audience: 'both',
    aiMetadata: { description: 'Delete an entire worksheet row by its 1-based row number and shift the rows below it up. Use when the row must be removed and the gap closed; to only blank a row in place without shifting use Clear Row by ID. Not idempotent — because deletion renumbers rows, re-running with the same number targets a different row.', idempotent: false },
    propertyGroups: [
        {
            key: 'workbook',
            display: 'section',
            label: 'Workbook',
            icon: 'file',
            props: ['storageSource', 'siteId', 'documentId', 'workbookId', 'worksheetId'],
        },
        {
            key: 'target_row',
            display: 'section',
            label: 'Row',
            icon: 'markdown',
            props: ['row_id', 'delete_warning'],
        },
    ],
    props: {
        storageSource: commonProps.storageSource,
        siteId: commonProps.siteId,
        documentId: commonProps.documentId,
        workbookId: commonProps.workbookId,
        worksheetId: commonProps.worksheetId,
        row_id: Property.Number({
            displayName: 'Row Number',
            description: 'Row 1 is the first row of the worksheet.',
            required: true,
        }),
        delete_warning: Property.MarkDown({
            value: 'Rows below move up. This cannot be undone.',
            variant: MarkdownVariant.WARNING,
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
