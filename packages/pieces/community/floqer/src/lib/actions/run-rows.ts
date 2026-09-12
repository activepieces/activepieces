import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { floqerAuth } from '../auth';
import { floqerApi } from '../common/client';
import { runRowsOutputSchema } from '../common/output-schemas';
import { floqerProps } from '../common/props';
import { FloqerRunRowsResult } from '../common/types';

export const runRowsAction = createAction({
    auth: floqerAuth,
    name: 'run_rows',
    displayName: 'Run Rows',
    description: 'Queue rows on a Floqer sheet through its action chain.',
    outputSchema: runRowsOutputSchema,
    props: {
        workflowId: floqerProps.workflowId(),
        sheetId: floqerProps.sheetId(),
        mode: Property.StaticDropdown({
            displayName: 'Rows To Run',
            description: 'Which rows on the sheet to queue.',
            required: true,
            defaultValue: 'row_ids',
            options: {
                options: [
                    { label: 'Specific row IDs', value: 'row_ids' },
                    { label: 'The first 10 rows on the sheet', value: 'first_10' },
                ],
            },
        }),
        rowIds: Property.Array({
            displayName: 'Row IDs',
            description:
                'Row UUIDs to queue. Add Rows returns these as `row_ids`. Ignored unless "Specific row IDs" is selected.',
            required: false,
        }),
    },
    async run({ auth, propsValue }) {
        const body = buildBody({ mode: propsValue.mode, rowIds: propsValue.rowIds });

        const response = await floqerApi.enveloped<FloqerRunRowsResult>({
            apiKey: auth.secret_text,
            method: HttpMethod.POST,
            path: `/api/v1/workflows/${propsValue.workflowId}/sheets/${propsValue.sheetId}/run`,
            body,
        });

        return response.data;
    },
});

function buildBody({ mode, rowIds }: { mode: string; rowIds: unknown }) {
    if (mode === 'first_10') {
        return { first_10: true };
    }
    const ids = normalizeRowIds(rowIds);
    if (ids.length === 0) {
        throw new Error(
            'Select at least one row ID, or switch "Rows To Run" to the first 10 rows on the sheet.',
        );
    }
    return { row_ids: ids };
}

function normalizeRowIds(rowIds: unknown): string[] {
    if (!Array.isArray(rowIds)) {
        return [];
    }
    return rowIds
        .map((id) => (typeof id === 'string' ? id.trim() : ''))
        .filter((id) => id.length > 0);
}
