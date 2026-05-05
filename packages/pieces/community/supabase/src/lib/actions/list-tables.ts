import { createAction } from "@activepieces/pieces-framework";
import { supabaseAuth } from '../auth';

export const listTables = createAction({
    name: 'list_tables',
    displayName: 'List Tables',
    description: 'Returns a list of all public tables in the database',
    auth: supabaseAuth,
    props: {},
    async run(context) {
        const { url, apiKey } = context.auth.props;

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
            return Object.keys(definitions).map(tableName => ({
                name: tableName
            }));
        }

        throw new Error(`Failed to fetch database schema from OpenAPI fallback. Status: ${response.status}`);
    },
});
