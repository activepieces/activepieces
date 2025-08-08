import { createAction, Property } from "@activepieces/pieces-framework";
import { supabaseAuth } from "../../index";
import { createClient } from "@supabase/supabase-js";
import { supabaseCommon } from "../common/props";

export const deleteRows = createAction({
    name: 'delete_rows',
    displayName: 'Delete Rows',
    description: 'Remove rows matching filter criteria from a table',
    auth: supabaseAuth,
    props: {
        table_name: supabaseCommon.table_name,
        filter_type: Property.StaticDropdown({
            displayName: 'Filter Type',
            description: 'How to filter rows for deletion',
            required: true,
            defaultValue: 'in',
            options: {
                options: [
                    { label: 'Column equals value', value: 'eq' },
                    { label: 'Column not equals value', value: 'neq' },
                    { label: 'Column is in list', value: 'in' },
                    { label: 'Column is greater than', value: 'gt' },
                    { label: 'Column is greater than or equal', value: 'gte' },
                    { label: 'Column is less than', value: 'lt' },
                    { label: 'Column is less than or equal', value: 'lte' },
                    { label: 'Column is null', value: 'is_null' },
                    { label: 'Column is not null', value: 'is_not_null' },
                    { label: 'Column matches pattern (LIKE)', value: 'like' },
                    { label: 'Column matches pattern (case-insensitive)', value: 'ilike' }
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
            description: 'The value to match against (not used for null checks)',
            required: false,
        }),
        filter_values: Property.Array({
            displayName: 'Filter Values',
            description: 'List of values for "in" filter type',
            required: false,
        }),
        count_deleted: Property.Checkbox({
            displayName: 'Count Deleted Rows',
            description: 'Whether to count the number of deleted rows',
            required: false,
            defaultValue: false,
        }),
        return_deleted: Property.Checkbox({
            displayName: 'Return Deleted Rows',
            description: 'Whether to return the deleted rows data',
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
            count_deleted, 
            return_deleted 
        } = context.propsValue;
        const { url, apiKey } = context.auth;

        const supabase = createClient(url, apiKey);
        
        let deleteQuery = supabase
            .from(table_name as string)
            .delete({ 
                count: count_deleted ? 'exact' : undefined 
            });

        const columnName = filter_column as string;
        switch (filter_type) {
            case 'eq':
                if (!filter_value) throw new Error('Filter value is required for equality check');
                deleteQuery = deleteQuery.eq(columnName, filter_value);
                break;
            case 'neq':
                if (!filter_value) throw new Error('Filter value is required for not-equals check');
                deleteQuery = deleteQuery.neq(columnName, filter_value);
                break;
            case 'in':
                if (!filter_values || filter_values.length === 0) {
                    throw new Error('Filter values are required for "in" filter type');
                }
                deleteQuery = deleteQuery.in(columnName, filter_values);
                break;
            case 'gt':
                if (!filter_value) throw new Error('Filter value is required for greater-than check');
                deleteQuery = deleteQuery.gt(columnName, filter_value);
                break;
            case 'gte':
                if (!filter_value) throw new Error('Filter value is required for greater-than-or-equal check');
                deleteQuery = deleteQuery.gte(columnName, filter_value);
                break;
            case 'lt':
                if (!filter_value) throw new Error('Filter value is required for less-than check');
                deleteQuery = deleteQuery.lt(columnName, filter_value);
                break;
            case 'lte':
                if (!filter_value) throw new Error('Filter value is required for less-than-or-equal check');
                deleteQuery = deleteQuery.lte(columnName, filter_value);
                break;
            case 'is_null':
                deleteQuery = deleteQuery.is(columnName, null);
                break;
            case 'is_not_null':
                deleteQuery = deleteQuery.not(columnName, 'is', null);
                break;
            case 'like':
                if (!filter_value) throw new Error('Filter value is required for like pattern matching');
                deleteQuery = deleteQuery.like(columnName, filter_value);
                break;
            case 'ilike':
                if (!filter_value) throw new Error('Filter value is required for case-insensitive like pattern matching');
                deleteQuery = deleteQuery.ilike(columnName, filter_value);
                break;
            default:
                throw new Error(`Unsupported filter type: ${filter_type}`);
        }

        const { data, error, count } = return_deleted 
            ? await deleteQuery.select()
            : await deleteQuery;

        if (error) {
            throw error;
        }

        const result: any = {
            success: true,
            deleted_rows: return_deleted ? data : undefined,
        };

        if (count_deleted) {
            result.deleted_count = count;
        }

        return result;
    }
});