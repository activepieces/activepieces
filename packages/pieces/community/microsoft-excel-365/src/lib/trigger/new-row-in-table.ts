import {
    OAuth2PropertyValue,
    Property,
    createTrigger,
} from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { excelCommon } from '../common/common';
import {
    DedupeStrategy,
    Polling,
    pollingHelper,
    httpClient,
    HttpMethod,
    AuthenticationType
} from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';
import { excelAuth } from '../..';

interface TableRow {
    index: number;
    values: [[string | number | boolean]];
}

// Helper function to get all rows from a specific table
async function getTableRows(auth: OAuth2PropertyValue, workbookId: string, tableId: string): Promise<TableRow[]> {
    try {
        const response = await httpClient.sendRequest<{ value: TableRow[] }>({
            method: HttpMethod.GET,
            url: `${excelCommon.baseUrl}/items/${workbookId}/workbook/tables/${encodeURIComponent(tableId)}/rows`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.access_token,
            },
        });
        return response.body.value ?? [];
    } catch (error) {
        throw new Error(`Failed to fetch table rows: ${error}`);
    }
}

const polling: Polling<
    OAuth2PropertyValue,
    {
        workbook_id: string;
        worksheet_id: string;
        table_id: string;
        has_headers: boolean;
    }
> = {
    strategy: DedupeStrategy.LAST_ITEM,
    items: async ({ auth, propsValue, lastItemId, store }) => {
        const rows = await getTableRows(auth, propsValue.workbook_id, propsValue.table_id);

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
                    propsValue.workbook_id,
                    auth.access_token,
                    propsValue.worksheet_id,
                    propsValue.table_id
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
        workbook_id: excelCommon.workbook_id,
        worksheet_id: excelCommon.worksheet_id,
        table_id: excelCommon.table_id,
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