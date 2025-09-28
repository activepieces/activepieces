import {
    OAuth2PropertyValue,
    Property,
    createTrigger,
} from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { excelCommon } from '../common/common';
import { excelAuth } from '../..';
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
async function getWorksheetRows(auth: OAuth2PropertyValue, workbookId: string, worksheetId: string): Promise<(string | number | boolean)[][]> {
    try {
        return await excelCommon.getAllRows(workbookId, worksheetId, auth.access_token);
    } catch (error) {
        throw new Error(`Failed to fetch worksheet rows: ${error}`);
    }
}

// Polling implementation using the framework's best practices
const polling: Polling<
    OAuth2PropertyValue,
    {
        workbook_id: string;
        worksheet_id: string;
        has_headers: boolean;
    }
> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS, store }) => {
        const allRows = await getWorksheetRows(auth, propsValue.workbook_id, propsValue.worksheet_id);
        
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
        workbook_id: excelCommon.workbook_id,
        worksheet_id: excelCommon.worksheet_id,
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