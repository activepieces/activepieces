import { createAction } from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';
import { supabaseAuth } from '../auth';
import { supabaseCommon } from '../common/props';

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

        const { data: rpcColumns, error } = await supabase.rpc('get_table_columns', {
            p_table_name: table_name as string,
        });

        if (!error && Array.isArray(rpcColumns) && rpcColumns.length > 0) {
            return rpcColumns.map((column: {
                column_name: string;
                data_type?: string;
                format?: string | null;
                description?: string | null;
            }) => ({
                column_name: column.column_name,
                data_type: column.data_type ?? 'unknown',
                format: column.format ?? null,
                description: column.description ?? null,
            }));
        }

        const response = await fetch(`${url}/rest/v1/`, {
            method: 'GET',
            headers: {
                apikey: apiKey,
                Authorization: `Bearer ${apiKey}`,
                Accept: 'application/openapi+json',
            },
        });

        if (!response.ok) {
            throw new Error(
                `Failed to fetch database schema. Status: ${response.status}`,
            );
        }

        const openApiSpec = await response.json();
        const definitions =
            openApiSpec.definitions ?? openApiSpec.components?.schemas ?? {};
        const tableDefinition = definitions[table_name as string];

        if (!tableDefinition || !tableDefinition.properties) {
            throw new Error(`Table '${table_name}' not found in database schema.`);
        }

        return Object.entries(
            tableDefinition.properties as Record<
                string,
                { type?: string; format?: string | null; description?: string | null }
            >,
        ).map(([columnName, columnDef]) => ({
            column_name: columnName,
            data_type: columnDef.type ?? 'unknown',
            format: columnDef.format ?? null,
            description: columnDef.description ?? null,
        }));
    },
});
