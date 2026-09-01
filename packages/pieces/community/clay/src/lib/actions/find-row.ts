import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { clayAuth } from '../auth';
import { CLAY_TABLE_FILTER_OPERATORS, clayApiCall, flattenClayTableRow } from '../common';

type ClayTableQueryResponse = {
    data: Record<string, { value?: unknown } | undefined>[];
    cursor?: string;
    truncated: boolean;
};

export const findRowAction = createAction({
    auth: clayAuth,
    name: 'find_row',
    classification: 'SEARCH',
    displayName: 'Find Row in Table',
    description: 'Queries a Clay table for rows matching an optional filter.',
    audience: 'both',
    aiMetadata: {
        description:
            'Search a Clay table for rows, optionally filtered by a single field/operator/value condition. Use this to look up existing rows before creating or updating one. Safe to retry, results may change between calls.',
        idempotent: true,
    },
    propertyGroups: [
        { key: 'filter', display: 'builder', label: 'Filter', icon: 'filter', props: ['filter_field', 'filter_operator', 'filter_value'] },
        { key: 'footer', display: 'footer', props: ['limit'] },
    ],
    props: {
        table_id: Property.ShortText({
            displayName: 'Table ID',
            description:
                'The ID of the Clay table to query. Found in the table\'s URL: app.clay.com/workspaces/.../tables/<table_id>.',
            required: true,
        }),
        filter_field: Property.ShortText({
            displayName: 'Field',
            description: 'Column name to filter on, e.g. "email". Leave blank to return rows without filtering.',
            required: false,
            icon: 'filter',
            placeholder: 'email',
        }),
        filter_operator: Property.StaticDropdown({
            displayName: 'Operator',
            required: false,
            defaultValue: '=',
            options: { options: CLAY_TABLE_FILTER_OPERATORS },
        }),
        filter_value: Property.ShortText({
            displayName: 'Value',
            description: 'Value to compare the field against. Not needed for "Is empty" / "Is not empty".',
            required: false,
        }),
        limit: Property.Number({
            displayName: 'Max results',
            required: false,
            defaultValue: 50,
            display: 'stepper',
            min: 1,
            max: 100,
        }),
        cursor: Property.ShortText({
            displayName: 'Cursor',
            description: 'Pagination cursor returned from a previous call, to fetch the next page of results.',
            required: false,
        }),
    },
    async run(context) {
        const { table_id, filter_field, filter_operator, filter_value, limit, cursor } = context.propsValue;

        const response = await clayApiCall<ClayTableQueryResponse>({
            apiKey: context.auth.secret_text,
            method: HttpMethod.POST,
            path: '/tables/query',
            body: {
                query: {
                    tables: [{ id: table_id }],
                    ...(filter_field
                        ? { filter: { field: filter_field, op: filter_operator ?? '=', value: filter_value } }
                        : {}),
                },
                limit: limit ?? 50,
                ...(cursor ? { cursor } : {}),
            },
        });

        return {
            records: response.body.data.map(flattenClayTableRow),
            cursor: response.body.cursor,
            truncated: response.body.truncated,
        };
    },
});
