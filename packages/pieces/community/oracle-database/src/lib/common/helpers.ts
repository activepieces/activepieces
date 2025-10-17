import { httpClient, HttpMethod } from "@activepieces/pieces-common";

async function executeQuery(auth: any, schema: string, statement: string, binds: any[] = []) {
    const { connectString, username, password, identityDomain } = auth;
    const url = `${connectString.replace(/\/$/, "")}/${schema}/_/sql`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
    };
    if (identityDomain) {
        headers['X-ID-TENANT-NAME'] = identityDomain;
    }

    const response = await httpClient.sendRequest<any>({
        method: HttpMethod.POST,
        url: url,
        headers: headers,
        body: {
            statementText: statement,
            binds: binds,
        },
    });

    return response.body.items[0]?.resultSet?.items || [];
}


export async function getSchemas(auth: any) { 
    if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first.' };
    try {
        const items = await executeQuery(auth, auth.username, 'SELECT username FROM all_users ORDER BY username');
        return {
            disabled: false,
            options: items.map((item: { username: string }) => ({
                label: item.username,
                value: item.username,
            })),
        };
    } catch (e) {
        console.error("Failed to fetch schemas", e);
        return {
            disabled: true,
            options: [],
            placeholder: "Could not load schemas. Check connection and permissions.",
        };
    }
}


export async function getTables(auth: any, schema: string) { 
    if (!auth || !schema) return { disabled: true, options: [], placeholder: 'Select a schema first.' };
    try {
        const items = await executeQuery(
            auth,
            schema,
            'SELECT table_name FROM all_tables WHERE owner = :owner ORDER BY table_name',
            [{ name: 'owner', data_type: 'VARCHAR2', value: schema }]
        );
        return {
            disabled: false,
            options: items.map((item: { table_name: string }) => ({
                label: item.table_name,
                value: item.table_name,
            })),
        };
    } catch (e) {
        console.error("Failed to fetch tables", e);
        return {
            disabled: true,
            options: [],
            placeholder: `Could not load tables for schema ${schema}.`,
        };
    }
}