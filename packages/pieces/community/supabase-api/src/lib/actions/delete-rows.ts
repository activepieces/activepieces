import { createAction, Property } from "@activepieces/pieces-framework";
import { AuthProps } from "../common";

export const deleteRows = createAction({
    name: 'delete_rows',
    displayName: 'Delete Rows',
    description: 'Remove rows matching filter criteria from a table',
    props: {
        table_name: Property.ShortText({
            displayName: 'Table Name',
            required: true,
            description: 'The name of the table to delete from'
        }),
        filter_column: Property.ShortText({
            displayName: 'Filter Column',
            required: true,
            description: 'The column to filter on'
        }),
        filter_values: Property.Array({
            displayName: 'Filter Values',
            required: true,
            description: 'The values to match against (will delete rows where the column matches any of these values)'
        }),
        return_deleted: Property.Checkbox({
            displayName: 'Return Deleted Rows',
            required: false,
            defaultValue: false,
            description: 'Whether to return the deleted rows'
        })
    },
    async run(context) {
        const { table_name, filter_column, filter_values, return_deleted } = context.propsValue;
        const { url, apiKey } = context.auth as AuthProps;

        const baseRequest = fetch(`${url}/rest/v1/${table_name}`, {
            method: 'DELETE',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Prefer': return_deleted ? 'return=representation' : 'return=minimal'
            },
            body: JSON.stringify({
                [filter_column]: {
                    in: filter_values
                }
            })
        });

        const response = await baseRequest;
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to delete rows: ${error.message}`);
        }

        if (return_deleted) {
            return await response.json();
        }

        return {
            success: true,
            status: response.status,
            statusText: response.statusText
        };
    }
});