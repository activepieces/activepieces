import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { floqerAuth } from '../auth';
import { floqerApi } from '../common/client';
import { addRowsOutputSchema } from '../common/output-schemas';
import { floqerProps } from '../common/props';
import { FloqerAddRowsResult } from '../common/types';

export const addRowsAction = createAction({
    auth: floqerAuth,
    name: 'add_rows',
    displayName: 'Add Rows',
    description: 'Add rows to a Floqer workflow sheet, and optionally run them through its actions.',
    outputSchema: addRowsOutputSchema,
    props: {
        workflowId: floqerProps.workflowId(),
        sheetId: floqerProps.sheetId(),
        rows: Property.Array({
            displayName: 'Rows',
            description:
                'Each row is an object whose keys are the sheet\'s input column names. Up to 1000 rows per call.',
            required: true,
        }),
        runAfterAdd: Property.StaticDropdown({
            displayName: 'Run After Adding',
            description:
                'What to run once the rows are written. Only the rows added by this step are affected.',
            required: false,
            defaultValue: 'none',
            options: {
                options: [
                    { label: 'Do not run', value: 'none' },
                    { label: 'Run the first 10 added rows', value: 'first_10' },
                    {
                        label: 'Run every added row (full credit cost)',
                        value: 'all',
                    },
                ],
            },
        }),
    },
    async run({ auth, propsValue }) {
        const rows = normalizeRows(propsValue.rows);

        if (rows.length === 0) {
            throw new Error('Add Rows needs at least one row.');
        }
        if (rows.length > MAX_ROWS_PER_CALL) {
            throw new Error(
                `Floqer accepts at most ${MAX_ROWS_PER_CALL} rows per call, but ${rows.length} were provided. Split them across multiple steps.`,
            );
        }

        const response = await floqerApi.enveloped<FloqerAddRowsResult>({
            apiKey: auth.secret_text,
            method: HttpMethod.POST,
            path: `/api/v1/workflows/${propsValue.workflowId}/sheets/${propsValue.sheetId}/rows`,
            body: {
                rows,
                run_after_add: propsValue.runAfterAdd ?? 'none',
            },
        });

        return {
            ...response.data,
            warnings: response.warnings ?? [],
        };
    },
});

function normalizeRows(rows: unknown): Record<string, unknown>[] {
    if (!Array.isArray(rows)) {
        throw new Error('Rows must be a list of objects.');
    }
    return rows.map((row, index) => {
        const parsed = typeof row === 'string' ? parseRow(row, index) : row;
        if (!isPlainObject(parsed)) {
            throw new Error(`Row ${index + 1} is not an object.`);
        }
        return parsed;
    });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseRow(row: string, index: number): unknown {
    try {
        return JSON.parse(row);
    } catch {
        throw new Error(`Row ${index + 1} is not valid JSON.`);
    }
}

const MAX_ROWS_PER_CALL = 1000;
