import { createAction } from '@activepieces/pieces-framework';
import { createClient } from '@supabase/supabase-js';
import { supabaseAuth } from '../auth';

export const listTables = createAction({
    name: 'list_tables',
    displayName: 'List Tables',
    description: 'Returns a list of all public tables and views in the database',
    auth: supabaseAuth,
    props: {},
    async run(context) {
        const { url, apiKey } = context.auth.props;
        const supabase = createClient(url, apiKey);

        const { data: tables, error } = await supabase.rpc('get_public_tables');

        if (!error && Array.isArray(tables) && tables.length > 0) {
            return tables.map((table: { table_name?: string; name?: string } | string) => ({
                name:
                    typeof table === 'string'
                        ? table
                        : table.table_name ?? table.name,
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

        return Object.keys(definitions).map((tableName) => ({
            name: tableName,
        }));
    },
});
