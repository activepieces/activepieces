import {
    AppConnectionValueForAuthProperty,
    OAuth2PropertyValue,
    Property,
    createTrigger,
} from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { excelCommon } from '../common/common';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';
import {
    DedupeStrategy,
    Polling,
    pollingHelper,
} from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';
import { excelAuth } from '../auth';

interface TableRow {
    index: number;
    values: [[string | number | boolean]];
}

// Helper function to get all rows from a specific table
async function getTableRows(auth: OAuth2PropertyValue, workbookId: string, tableId: string, drivePath: string): Promise<TableRow[]> {
    try {
        const cloud = auth.props?.['cloud'] as string | undefined;
        const client = createMSGraphClient(auth.access_token, cloud);
        const response = await client
            .api(`${drivePath}/items/${workbookId}/workbook/tables/${encodeURIComponent(tableId)}/rows`)
            .get();
        return response.value ?? [];
    } catch (error) {
        throw new Error(`Failed to fetch table rows: ${error}`);
    }
}

const polling: Polling<
    AppConnectionValueForAuthProperty<typeof excelAuth>,
    {
        storageSource: string;
        siteId?: string;
        documentId?: string;
        workbookId: string;
        worksheetId: string;
        tableId: string;
        has_headers: boolean;
    }
> = {
    strategy: DedupeStrategy.LAST_ITEM,
    items: async ({ auth, propsValue, lastItemId, store }) => {
        const { storageSource, siteId, documentId, workbookId, worksheetId, tableId } = propsValue;
        const drivePath = getDrivePath(storageSource, siteId, documentId);
        const rows = await getTableRows(auth, workbookId, tableId, drivePath);

        if (rows.length === 0) {
            return [];
        }

        const cachedHeaders = await store.get<string[]>('table_headers');
        let headers: string[] = [];

        if (cachedHeaders && cachedHeaders.length > 0) {
            headers = cachedHeaders
        } else {
            try {
                headers = await excelCommon.getTableHeaders(
                    drivePath,
                    workbookId,
                    auth.access_token,
                    worksheetId,
                    tableId
                );
                await store.put('table_headers', headers);
            } catch (error) {
                headers = []
            }
        }
        

        const processedRows = rows.map(row => {
            let rowData: Record<string, unknown> = {};

            if (propsValue.has_headers && headers.length > 0) {
                // Map values to header keys
                rowData = headers.reduce((acc, header, index) => {
                    acc[header] = row.values[0]?.[index] ?? null;
                    return acc;
                }, {} as Record<string, unknown>);
            } else {
                // Use default column letter keys (A, B, C...)
                rowData = row.values[0]?.reduce((acc, value, index) => {
                    acc[excelCommon.numberToColumnName(index + 1)] = value;
                    return acc;
                }, {} as Record<string, unknown>) ?? {};
            }

            return {
                id: row.index, // The row's zero-based index is its unique ID
                data: {
                    rowIndex: row.index,
                    values: rowData
                }
            };
        });

        // The polling helper will filter for new rows where the ID (row.index) is greater than lastItemId
        const newItems = processedRows.filter(item => isNil(lastItemId) || item.id > (lastItemId as number));
        return newItems;
    }
};

export const newRowInTableTrigger = createTrigger({
    auth: excelAuth,
    name: 'new_row_in_table',
    displayName: 'New Row in Table',
    description: 'Fires when a new row is added to a table within a worksheet.',
    props: {
        storageSource: commonProps.storageSource,
        siteId: commonProps.siteId,
        documentId: commonProps.documentId,
        workbookId: commonProps.workbookId,
        worksheetId: commonProps.worksheetId,
        tableId: commonProps.tableId,
        has_headers: Property.Checkbox({
            displayName: "My table has headers",
            description: "Enable this if the first row of your table is a header row.",
            required: true,
            defaultValue: true,
        })
    },
    type: TriggerStrategy.POLLING,
    sampleData: {
        "rowIndex": 0,
        "values": {
            "ID": 1,
            "Name": "John Doe",
            "Email": "john.doe@example.com"
        }
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