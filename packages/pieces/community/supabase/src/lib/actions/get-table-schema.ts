import { createAction } from "@activepieces/pieces-framework";
import { supabaseAuth } from '../auth';
import { createClient } from "@supabase/supabase-js";
import { supabaseCommon } from "../common/props";

export const getTableSchema = createAction({
    name: 'get_table_schema',
    displayName: 'Get Table Schema',
    description: 'Returns the column definitions for a specific table',
    auth: supabaseAuth,
    props: {
        table_name: supabaseCommon.table_name,
    },
    async run(context) {
        const { table_name } = context.propsValue;
        const { url, apiKey } = context.auth.props;
        const supabase = createClient(url, apiKey);

        try {
            const { data: columns, error } = await supabase.rpc('get_table_columns', {
                p_table_name: table_name
            });

            if (!error && columns && columns.length > 0) {
                return columns;
            }
        } catch (rpcError) {
            // Fallback to OpenAPI
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
            const tableDefinition = definitions[table_name as string];

            if (tableDefinition && tableDefinition.properties) {
                return Object.entries(tableDefinition.properties).map(([columnName, columnDef]: [string, any]) => {
                    return {
                        column_name: columnName,
                        data_type: columnDef.type || 'unknown',
                        format: columnDef.format || null,
                        description: columnDef.description || null
                    };
                });
            }
            throw new Error(`Table '${table_name}' not found in database schema.`);
        }

        throw new Error(`Failed to fetch database schema from OpenAPI fallback. Status: ${response.status}`);
    },
});
