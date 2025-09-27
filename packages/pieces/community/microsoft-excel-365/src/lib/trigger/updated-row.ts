import {
    Property,
    createTrigger,
} from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { excelCommon } from '../common/common';
import { excelAuth } from '../..';
import { createHmac } from 'node:crypto';


function createRowHash(rowData: unknown[]): string {
    const rowString = JSON.stringify(rowData);
    return createHmac('sha1', 'activepieces').update(rowString).digest('hex');
}

export const updatedRow = createTrigger({
    auth: excelAuth,
    name: 'updatedRow',
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
        "rowIndex": 2, 
        "values": { "ID": 101, "Product": "Widget", "Price": 19.99 }
    },

    onEnable: async (context) => {
        const { workbook_id, worksheet_id } = context.propsValue;
        const allRows = await excelCommon.getAllRows(workbook_id, worksheet_id, context.auth.access_token);
        
        const currentHashes: Record<number, string> = {};
        allRows.forEach((row: unknown[], index: number) => { 
            currentHashes[index] = createRowHash(row);
        });
        
        await context.store.put(`row_hashes`, currentHashes);
    },

    onDisable: async (context) => {
        await context.store.delete(`row_hashes`);
    },

    run: async (context) => {
        const { workbook_id, worksheet_id, has_headers } = context.propsValue;
        
        const oldHashes = await context.store.get<Record<number, string>>(`row_hashes`) ?? {};
        
        const allRows = await excelCommon.getAllRows(workbook_id, worksheet_id, context.auth.access_token);
        
        const headers = (has_headers && allRows.length > 0) ? allRows[0] as string[] : [];
        const dataRows = (has_headers && allRows.length > 0) ? allRows.slice(1) : allRows;

        const currentHashes: Record<number, string> = {};
        const changedRows: unknown[] = [];

        dataRows.forEach((row: any[], index: number) => {
            const rowIndex = has_headers ? index + 1 : index;
            const newHash = createRowHash(row);
            currentHashes[rowIndex] = newHash;

            const oldHash = oldHashes[rowIndex];
            
            if (oldHash !== newHash) {
                const formattedRow: Record<string, unknown> = {};
                if(has_headers) {
                    headers.forEach((header, colIndex) => { 
                        formattedRow[header] = row[colIndex];
                    });
                } else {
                    row.forEach((cell, colIndex) => { 
                        formattedRow[excelCommon.numberToColumnName(colIndex + 1)] = cell;
                    });
                }
                changedRows.push({
                    rowIndex: rowIndex + 1, 
                    values: formattedRow,
                });
            }
        });

        await context.store.put(`row_hashes`, currentHashes);

        return changedRows;
    },

    test: async (context) => {
        const { workbook_id, worksheet_id, has_headers } = context.propsValue;
        const allRows = await excelCommon.getAllRows(workbook_id, worksheet_id, context.auth.access_token);
        
        if (allRows.length === 0) return [];

        const headers = (has_headers && allRows.length > 0) ? allRows[0] as string[] : [];
        const dataRows = (has_headers && allRows.length > 0) ? allRows.slice(1) : allRows;

        if (dataRows.length === 0) return [];

        const lastRow = dataRows[dataRows.length - 1];
        const formattedRow: Record<string, unknown> = {};

        if (has_headers) {
            headers.forEach((header, colIndex) => {
                formattedRow[header] = lastRow[colIndex];
            });
        } else {
            lastRow.forEach((cell: any, colIndex: number) => { 
                formattedRow[excelCommon.numberToColumnName(colIndex + 1)] = cell;
            });
        }

        return [{
            rowIndex: allRows.length,
            values: formattedRow,
        }];
    },
});