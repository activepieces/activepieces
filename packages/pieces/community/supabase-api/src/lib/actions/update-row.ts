import { createAction, Property } from "@activepieces/pieces-framework";
import { AuthProps } from "../common";

export const updateRow = createAction({
    name: 'update_row',
    displayName: 'Update Row',
    description: 'Update rows in a specified table based on filter criteria',
    props: {
        table_name: Property.ShortText({
            displayName: 'Table Name',
            required: true,
            description: 'The name of the table to update'
        }),
        filter_column: Property.ShortText({
            displayName: 'Filter Column',
            required: true,
            description: 'The column to filter on (e.g. id)'
        }),
        filter_value: Property.ShortText({
            displayName: 'Filter Value',
            required: true,
            description: 'The value to match against'
        }),
        update_data: Property.Object({
            displayName: 'Update Data',
            required: true,
            description: 'The data to update (as key-value pairs)'
        }),
        return_updated: Property.Checkbox({
            displayName: 'Return Updated Row',
            required: false,
            defaultValue: false,
            description: 'Whether to return the updated row'
        })
    },
    async run(context) {
        const { table_name, filter_column, filter_value, update_data, return_updated } = context.propsValue;
        const { url, apiKey } = context.auth as AuthProps;

        const baseRequest = fetch(`${url}/rest/v1/${table_name}?${filter_column}=eq.${filter_value}`, {
            method: 'PATCH',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Prefer': return_updated ? 'return=representation' : 'return=minimal'
            },
            body: JSON.stringify(update_data)
        });

        const response = await baseRequest;
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to update row: ${error.message}`);
        }

        if (return_updated) {
            return await response.json();
        }

        return {
            success: true,
            status: response.status,
            statusText: response.statusText
        };
    }
});