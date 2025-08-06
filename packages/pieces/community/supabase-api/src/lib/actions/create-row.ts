import { createAction, Property } from "@activepieces/pieces-framework";
import { supabaseApiAuth } from "../../index";
import { createClient } from "@supabase/supabase-js";

export const createRow = createAction({
    name: 'create_row',
    displayName: 'Create Row',
    description: 'Insert a new row into a specified table',
    auth: supabaseApiAuth,
    props: {
        table: Property.ShortText({
            displayName: 'Table',
            description: 'The name of the table to insert into',
            required: true,
        }),
        values: Property.Object({
            displayName: 'Values',
            description: 'The values to insert into the row (as key-value pairs)',
            required: true,
        }),
        returnRow: Property.Checkbox({
            displayName: 'Return Created Row',
            description: 'Whether to return the created row',
            required: false,
            defaultValue: true,
        }),
    },
    async run(context) {
        const { table, values, returnRow } = context.propsValue;
        const { url, apiKey } = context.auth;

        const supabase = createClient(url, apiKey);
        
        const query = supabase.from(table).insert(values);
        
        if (returnRow) {
            query.select();
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return data;
    },
});