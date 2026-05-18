import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

export const clearRowAction = createAction({
    auth: excelAuth,
    name: 'clear_row',
    displayName: 'Clear Row by ID',
    description: 'Clear contents/formatting of an entire row by its ID.',
    props: {
        storageSource: commonProps.storageSource,
        siteId: commonProps.siteId,
        documentId: commonProps.documentId,
        workbookId: commonProps.workbookId,
        worksheetId: commonProps.worksheetId,
        row_id: Property.Number({
            displayName: 'Row Number',
            description: 'The number of the row to be cleared (e.g., 5 for the 5th row).',
            required: true,
        }),
        applyTo: Property.StaticDropdown({
            displayName: "Clear Type",
            description: "Specify what to clear from the row.",
            required: true,
            defaultValue: 'All',
            options: {
                options: [
                    {
                        label: 'All (Contents and Formatting)',
                        value: 'All'
                    },
                    {
                        label: 'Contents Only',
                        value: 'Contents'
                    },
                    {
                        label: 'Formats Only',
                        value: 'Formats'
                    }
                ]
            }
        })
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
            throw new Error('Row index must be a positive integer.');
        }


        // Construct the range address for the entire row, e.g., '5:5'
        const rowAddress = `${row_id}:${row_id}`;

        const client = createMSGraphClient(access_token, cloud);
        await client
            .api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='${rowAddress}')/clear`)
            .post({ applyTo: applyTo });

        // A successful request returns a 200 OK with no body.
        return {};
    },
});