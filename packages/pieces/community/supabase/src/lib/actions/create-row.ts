import { createAction, Property } from "@activepieces/pieces-framework";
import { supabaseAuth } from '../auth';
import { createClient } from "@supabase/supabase-js";
import { supabaseCommon } from "../common/props";

export const createRow = createAction({
    name: 'create_row',
    displayName: 'Create Row',
    description: 'Create a new row in a table',
    auth: supabaseAuth,
    props: {
        table_name: supabaseCommon.table_name,
        row_data: supabaseCommon.table_columns,
        return_row: Property.Checkbox({
            displayName: 'Return Created Row',
            description: 'Whether to return the created row',
            required: false,
            defaultValue: true,
        }),
    },
    async run(context) {
        const { table_name, row_data, return_row } = context.propsValue;
        const { url, apiKey } = context.auth.props;

        const supabase = createClient(url, apiKey);
        
        // Ensure JSON fields are parsed if they are strings
        const processedRowData = { ...row_data };
        for (const key in processedRowData) {
            const value = processedRowData[key];
            if (typeof value === 'string') {
                try {
                    // Try parsing as JSON. If it's a valid JSON string, parse it.
                    // This is important for fields that are intended to be json/jsonb.
                    if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
                        processedRowData[key] = JSON.parse(value);
                    }
                } catch (e) {
                    // Not valid JSON or already a string, keep as is
                }
            }
        }

        const baseQuery = supabase.from(table_name as string).insert(processedRowData);
        
        const { data, error } = return_row 
            ? await baseQuery.select()
            : await baseQuery;

        if (error) {
            let errorMessage = error.message || 'Unknown error occurred';
            
            if (error.code === '23505') {
                errorMessage = `Duplicate value: ${error.message}`;
            } else if (error.code === '23503') {
                errorMessage = `Foreign key constraint violation: ${error.message}`;
            } else if (error.code === '23502') {
                errorMessage = `Required field missing: ${error.message}`;
            } else if (error.code === '42703') {
                errorMessage = `Column does not exist: ${error.message}`;
            } else if (error.code === '42P01') {
                errorMessage = `Table does not exist: ${error.message}`;
            }
            
            throw new Error(errorMessage);
        }



        return data;
    },
});