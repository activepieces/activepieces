import { createAction, MarkdownVariant, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

export const clearRowAction = createAction({
    auth: excelAuth,
    name: 'clear_row',
    classification: 'DESTRUCTIVE',
    displayName: 'Clear Row',
    description: 'Clear the contents or formatting of a row.',
    audience: 'both',
    aiMetadata: { description: 'Clear an entire row in a worksheet by its 1-based row number. Choose what to remove via Clear Type: contents, formats, or both. Clears in place without deleting the row or shifting cells up — use Delete Row when you need the row removed and rows below shifted. Idempotent — re-running on an already-cleared row has no further effect.', idempotent: true },
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
            props: ['row_id', 'applyTo', 'clear_warning'],
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
        applyTo: Property.StaticDropdown({
            displayName: 'What to Clear',
            required: true,
            defaultValue: 'All',
            display: 'cards',
            options: {
                options: [
                    {
                        label: 'Everything',
                        value: 'All',
                        icon: 'trash'
                    },
                    {
                        label: 'Contents',
                        value: 'Contents',
                        icon: 'text'
                    },
                    {
                        label: 'Formatting',
                        value: 'Formats',
                        icon: 'sliders'
                    }
                ]
            }
        }),
        clear_warning: Property.MarkDown({
            value: 'Cleared cells cannot be restored.',
            variant: MarkdownVariant.WARNING,
        }),
    },
    async run(context) {
        const { storageSource, siteId, documentId, workbookId, worksheetId, row_id, applyTo } = context.propsValue;
        const { access_token } = context.auth;
        const cloud = (context.auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

        if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
            throw new Error('please select SharePoint site and document library.');
        }
        const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

        if (typeof row_id !== 'number' || !Number.isInteger(row_id) || row_id < 1) {
            throw new Error('Row number must be a positive integer.');
        }

        const rowAddress = `${row_id}:${row_id}`;

        const client = createMSGraphClient(access_token, cloud);
        await client
            .api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='${rowAddress}')/clear`)
            .post({ applyTo: applyTo });

        return {};
    },
});