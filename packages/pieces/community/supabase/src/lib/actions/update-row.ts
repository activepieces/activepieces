import { createAction, Property, DynamicPropsValue } from "@activepieces/pieces-framework";
import { supabaseAuth } from "../../index";
import { createClient } from "@supabase/supabase-js";
import { supabaseCommon } from "../common/props";

export const updateRow = createAction({
    name: 'update_row',
    displayName: 'Update Row',
    description: 'Update rows in a table based on filter criteria',
    auth: supabaseAuth,
    props: {
        table_name: supabaseCommon.table_name,
        filter_type: Property.StaticDropdown({
            displayName: 'Filter Type',
            description: 'How to identify rows to update',
            required: true,
            defaultValue: 'eq',
            options: {
                options: [
                    { label: 'Column equals value', value: 'eq' },
                    { label: 'Column is in list of values', value: 'in' },
                    { label: 'Column is greater than value', value: 'gt' }
                ]
            }
        }),
        filter_column: Property.Dropdown({
            displayName: 'Filter Column',
            description: 'Select the column to filter on',
            required: true,
            refreshers: ['table_name'],
            options: async ({ auth, table_name }) => {
                if (!auth || !table_name) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please select a table first'
                    };
                }
                
                try {
                    const { url, apiKey } = auth as { url: string; apiKey: string };
                    const supabase = createClient(url, apiKey);
                    
                    try {
                        const { data: columns, error } = await supabase.rpc('get_table_columns', { 
                            p_table_name: table_name as unknown as string 
                        });
                        
                        if (!error && columns && columns.length > 0) {
                            return {
                                disabled: false,
                                options: columns.map((col: any) => ({
                                    label: `${col.column_name} (${col.data_type})`,
                                    value: col.column_name
                                }))
                            };
                        }
                    } catch (rpcError) {
                        // Continue to OpenAPI fallback
                    }
                    
                    const response = await fetch(`${url}/rest/v1/`, {
                        method: 'GET',
                        headers: {
                            'apikey': apiKey,
                            'Authorization': `Bearer ${apiKey}`,
                            'Accept': 'application/openapi+json'
                        }
                    });

                    if (response.ok) {
                        const openApiSpec = await response.json();
                        const definitions = openApiSpec.definitions || openApiSpec.components?.schemas || {};
                        const tableDefinition = definitions[table_name as unknown as string];
                        
                        if (tableDefinition && tableDefinition.properties) {
                            const options = Object.entries(tableDefinition.properties).map(([columnName, columnDef]: [string, any]) => {
                                const type = columnDef.type || 'unknown';
                                return {
                                    label: `${columnName} (${type})`,
                                    value: columnName
                                };
                            });
                            
                            return {
                                disabled: false,
                                options
                            };
                        }
                    }
                    
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Could not load columns'
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading columns'
                    };
                }
            }
        }),
        filter_value: Property.ShortText({
            displayName: 'Filter Value',
            description: 'The value to match against (not used for "in list" filter)',
            required: false,
        }),
        filter_values: Property.Array({
            displayName: 'Filter Values',
            description: 'List of values for "in list" filter type',
            required: false,
        }),
        update_data: supabaseCommon.update_fields,
        count_updated: Property.Checkbox({
            displayName: 'Count Updated Rows',
            description: 'Whether to count the number of updated rows',
            required: false,
            defaultValue: false,
        }),
        return_updated: Property.Checkbox({
            displayName: 'Return Updated Rows',
            description: 'Whether to return the updated rows data',
            required: false,
            defaultValue: false,
        })
    },
    async run(context) {
        const { 
            table_name, 
            filter_type, 
            filter_column, 
            filter_value, 
            filter_values, 
            update_data,
            count_updated, 
            return_updated 
        } = context.propsValue;
        const { url, apiKey } = context.auth;

        const supabase = createClient(url, apiKey);
        
        let updateQuery = supabase
            .from(table_name as string)
            .update(update_data, { 
                count: count_updated ? 'exact' : undefined 
            });

        const columnName = filter_column as string;
        switch (filter_type) {
            case 'eq':
                if (!filter_value) throw new Error('Filter value is required for equality check');
                updateQuery = updateQuery.eq(columnName, filter_value);
                break;
            case 'in':
                if (!filter_values || filter_values.length === 0) {
                    throw new Error('Filter values are required for "in list" filter type');
                }
                updateQuery = updateQuery.in(columnName, filter_values);
                break;
            case 'gt':
                if (!filter_value) throw new Error('Filter value is required for greater-than check');
                updateQuery = updateQuery.gt(columnName, filter_value);
                break;
            default:
                throw new Error(`Unsupported filter type: ${filter_type}`);
        }

        const { data, error, count } = return_updated 
            ? await updateQuery.select()
            : await updateQuery;

        if (error) {
            let errorMessage = error.message || 'Unknown error occurred';
            
            if (error.code === '23505') {
                errorMessage = `Duplicate value: ${error.message}`;
            } else if (error.code === '23503') {
                errorMessage = `Foreign key constraint violation: ${error.message}`;
            } else if (error.code === '42703') {
                errorMessage = `Column does not exist: ${error.message}`;
            } else if (error.code === '42P01') {
                errorMessage = `Table does not exist: ${error.message}`;
            }
            
            throw new Error(errorMessage);
        }

        const result: any = {
            success: true,
            updated_rows: return_updated ? data : undefined,
        };

        if (count_updated) {
            result.updated_count = count;
        }

        return result;
    }
});