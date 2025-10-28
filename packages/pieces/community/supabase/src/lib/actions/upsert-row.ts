import { createAction, Property } from "@activepieces/pieces-framework";
import { supabaseAuth } from "../../index";
import { createClient } from "@supabase/supabase-js";
import { supabaseCommon } from "../common/props";

export const upsertRow = createAction({
    name: 'upsert_row',
    displayName: 'Upsert Row',
    description: 'Insert or update a row in a table',
    auth: supabaseAuth,
    props: {
        table_name: supabaseCommon.table_name,
        on_conflict: Property.Dropdown({
            displayName: 'Conflict Column',
            description: 'Select the unique column to determine duplicates (required for upsert to work)',
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
                            const options = columns.map((col: any) => ({
                                label: `${col.column_name} (${col.data_type})`,
                                value: col.column_name
                            }));
                            
                            options.sort((a: any, b: any) => {
                                if (a.value === 'id') return -1;
                                if (b.value === 'id') return 1;
                                if (a.value.includes('_id')) return -1;
                                if (b.value.includes('_id')) return 1;
                                if (a.value === 'email') return -1;
                                if (b.value === 'email') return 1;
                                return 0;
                            });
                            
                            return {
                                disabled: false,
                                options
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
                            
                            options.sort((a: any, b: any) => {
                                if (a.value === 'id') return -1;
                                if (b.value === 'id') return 1;
                                if (a.value.includes('_id')) return -1;
                                if (b.value.includes('_id')) return 1;
                                if (a.value === 'email') return -1;
                                if (b.value === 'email') return 1;
                                return 0;
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
        row_data: supabaseCommon.upsert_fields,
        count_upserted: Property.Checkbox({
            displayName: 'Count Upserted Rows',
            description: 'Whether to count the number of upserted rows',
            required: false,
            defaultValue: false,
        }),
        return_upserted: Property.Checkbox({
            displayName: 'Return Upserted Rows',
            description: 'Whether to return the upserted rows data',
            required: false,
            defaultValue: false,
        })
    },
    async run(context) {
        const { 
            table_name, 
            row_data, 
            on_conflict,
            count_upserted, 
            return_upserted 
        } = context.propsValue;
        const { url, apiKey } = context.auth;

        const supabase = createClient(url, apiKey);
        
        const upsertOptions: any = {
            onConflict: on_conflict,
            count: count_upserted ? 'exact' : undefined
        };

        const upsertQuery = supabase
            .from(table_name as string)
            .upsert(row_data, upsertOptions);

        const { data, error, count } = return_upserted 
            ? await upsertQuery.select()
            : await upsertQuery;

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
            upserted_rows: return_upserted ? data : undefined,
        };

        if (count_upserted) {
            result.upserted_count = count;
        }

        return result;
    }
});