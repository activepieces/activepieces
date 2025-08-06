import { createAction, Property } from "@activepieces/pieces-framework";
import { AuthProps } from "../common";

export const upsertRow = createAction({
    name: 'upsert_row',
    displayName: 'Upsert Row',
    description: 'Insert or update a row in a specified table',
    props: {
        table_name: Property.ShortText({
            displayName: 'Table Name',
            required: true,
            description: 'The name of the table to upsert into'
        }),
        row_data: Property.Object({
            displayName: 'Row Data',
            required: true,
            description: 'The data to upsert (must include primary key or unique columns)'
        }),
        on_conflict: Property.ShortText({
            displayName: 'On Conflict Column',
            required: false,
            description: 'Comma-separated unique column(s) to determine conflicts (e.g., "email" or "id,email")'
        }),
        ignore_duplicates: Property.Checkbox({
            displayName: 'Ignore Duplicates',
            required: false,
            defaultValue: false,
            description: 'If true, duplicate rows are ignored. If false, existing rows are updated'
        }),
        return_row: Property.Checkbox({
            displayName: 'Return Upserted Row',
            required: false,
            defaultValue: false,
            description: 'Whether to return the upserted row'
        })
    },
    async run(context) {
        const { table_name, row_data, on_conflict, ignore_duplicates, return_row } = context.propsValue;
        const { url, apiKey } = context.auth as AuthProps;

        let endpoint = `${url}/rest/v1/${table_name}`;
        
        // Build the Prefer header
        const preferParts = [];
        if (return_row) preferParts.push('return=representation');
        if (ignore_duplicates) preferParts.push('resolution=ignore-duplicates');
        if (on_conflict) preferParts.push(`resolution=merge-duplicates`);

        const baseRequest = fetch(endpoint, {
            method: 'POST',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Prefer': preferParts.join(','),
                ...(on_conflict && { 'On-Conflict': on_conflict })
            },
            body: JSON.stringify(row_data)
        });

        const response = await baseRequest;
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to upsert row: ${error.message}`);
        }

        if (return_row) {
            return await response.json();
        }

        return {
            success: true,
            status: response.status,
            statusText: response.statusText
        };
    }
});