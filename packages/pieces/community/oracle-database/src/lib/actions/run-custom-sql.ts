import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { oracleAuth } from "../../index"; 
import { getSchemas } from "../common/helpers";

export const runCustomSql = createAction({
    auth: oracleAuth,
    name: 'run_custom_sql',
    displayName: 'Run Custom SQL',
    description: 'Runs a custom SQL query or PL/SQL block.',
    props: {
        schema: Property.Dropdown({
            displayName: 'Schema',
            description: 'The database schema to run the query against.',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please connect your account first.'
                    };
                }
                return await getSchemas(auth as any);
            }
        }),
        sql: Property.LongText({
            displayName: 'SQL Statement',
            description: 'The SQL statement or PL/SQL block to execute.',
            required: true,
        }),
        binds: Property.Json({
            displayName: 'Bind Variables',
            description: 'An array of bind variables. E.g., [{"name": "id", "data_type": "NUMBER", "value": 100}]',
            required: false,
            defaultValue: []
        }),
    },

    async run(context) {
        const { schema, sql, binds } = context.propsValue;
        const { connectString, username, password, identityDomain } = context.auth;

        const url = `${connectString.replace(/\/$/, "")}/${schema}/_/sql`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
        };

        if (identityDomain) {
            headers['X-ID-TENANT-NAME'] = identityDomain;
        }

        const requestBody: { statementText: string; binds?: unknown[] } = {
            statementText: sql,
        };

        if (binds && Array.isArray(binds) && binds.length > 0) {
            requestBody.binds = binds;
        }

        try {
            const response = await httpClient.sendRequest({
                method: HttpMethod.POST,
                url: url,
                headers: headers,
                body: requestBody,
            });
            return response.body;
        } catch (error: any) {
            throw new Error(`Failed to execute SQL query: ${error.message}`);
        }
    },
});