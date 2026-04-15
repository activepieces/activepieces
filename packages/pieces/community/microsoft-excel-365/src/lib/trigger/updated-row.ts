import {
    AppConnectionValueForAuthProperty,
    Property,
    createTrigger,
} from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { excelCommon } from '../common/common';
import { commonProps } from '../common/props';
import { getDrivePath } from '../common/helpers';
import { excelAuth } from '../auth';
import {
    DedupeStrategy,
    Polling,
    pollingHelper,
} from '@activepieces/pieces-common';
import { createHmac } from 'node:crypto';

const triggerName = 'updated_row';

function createRowHash(rowData: unknown[]): string {
    const rowString = JSON.stringify(rowData);
    return createHmac('sha1', 'activepieces').update(rowString).digest('hex');
}

// Helper function to get all worksheet rows with error handling
async function getWorksheetRows(auth: AppConnectionValueForAuthProperty<typeof excelAuth>, workbookId: string, worksheetId: string, drivePath: string): Promise<(string | number | boolean)[][]> {
    try {
        return await excelCommon.getAllRows(workbookId, worksheetId, auth.access_token, drivePath);
    } catch (error) {
        throw new Error(`Failed to fetch worksheet rows: ${error}`);
    }
}

// Polling implementation using the framework's best practices
const polling: Polling<
    AppConnectionValueForAuthProperty<typeof excelAuth>,
    {
        storageSource: string;
        siteId?: string;
        documentId?: string;
        workbookId: string;
        worksheetId: string;
        has_headers: boolean;
    }
> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, store }) => {
        const { storageSource, siteId, documentId, workbookId, worksheetId } = propsValue;
        const drivePath = getDrivePath(storageSource, siteId, documentId);
        const allRows = await getWorksheetRows(auth, workbookId, worksheetId, drivePath);
        
        if (allRows.length === 0) {
            return [];
        }

        // Get stored row hashes from previous run
        const oldHashes = await store.get<Record<number, string>>('row_hashes') ?? {};
        
        const headers = (propsValue.has_headers && allRows.length > 0) ? allRows[0] : [];
        const dataRows = (propsValue.has_headers && allRows.length > 0) ? allRows.slice(1) : allRows;

        const currentHashes: Record<number, string> = {};
        const changedItems: Array<{ epochMilliSeconds: number; data: unknown }> = [];
        const currentTime = Date.now();

        // Process each data row
        dataRows.forEach((row, index) => {
            const rowIndex = propsValue.has_headers ? index + 1 : index;
            const newHash = createRowHash(row);
            currentHashes[rowIndex] = newHash;

            const oldHash = oldHashes[rowIndex];
            
            // Row has changed or is new
            if (oldHash !== newHash) {
                const formattedRow: Record<string, unknown> = {};
                
                if (propsValue.has_headers && headers.length > 0) {
                    headers.forEach((header, colIndex) => {
                        formattedRow[String(header)] = row[colIndex] ?? null;
                    });
                } else {
                    row.forEach((cell, colIndex) => {
                        formattedRow[excelCommon.numberToColumnName(colIndex + 1)] = cell;
                    });
                }

                changedItems.push({
                    epochMilliSeconds: currentTime,
                    data: {
                        rowIndex: rowIndex + 1, // Make it 1-based for user readability
                        values: formattedRow,
                        changeType: oldHash ? 'updated' : 'added'
                    }
                });
            }
        });

        // Update stored hashes for next run
        await store.put('row_hashes', currentHashes);

        return changedItems;
    }
};

export const updatedRowTrigger = createTrigger({
    auth: excelAuth,
    name: triggerName,
    displayName: 'Updated Row',
    description: 'Fires when a row (in a worksheet) is added or updated.',
    props: {
        storageSource: commonProps.storageSource,
        siteId: commonProps.siteId,
        documentId: commonProps.documentId,
        workbookId: commonProps.workbookId,
        worksheetId: commonProps.worksheetId,
        has_headers: Property.Checkbox({
            displayName: "First row has headers",
            description: "Enable this if the first row of your worksheet should be treated as headers.",
            required: true,
            defaultValue: false,
        })
    },
    type: TriggerStrategy.POLLING,
    sampleData: {
        "rowIndex": 1,
        "values": { "ID": 101, "Product": "Widget", "Price": 19.99 }
    },

    onEnable: async (context) => {
        const { storageSource, siteId, documentId } = context.propsValue as any;
        if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
            throw new Error('please select SharePoint site and document library.');
        }
        await pollingHelper.onEnable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },

    onDisable: async (context) => {

        await pollingHelper.onDisable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },

    run: async (context) => {
        return await pollingHelper.poll(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
            files: context.files,
        });
    },

    test: async (context) => {
        return await pollingHelper.test(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
            files: context.files,
        });
    },
});