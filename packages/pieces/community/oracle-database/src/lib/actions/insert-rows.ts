import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { oracleAuth } from "../../index";
import { getSchemas, getTables } from "../common/helpers"

export const insertRows = createAction({
    auth: oracleAuth,
    name: 'insert_rows',
    displayName: 'Insert Rows',
    description: 'Insert a batch of rows into a table.',
    props: {
        schema: Property.Dropdown({
            displayName: 'Schema',
            description: 'The database schema where the table is located.',
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
        table: Property.Dropdown({
            displayName: 'Table',
            description: 'The name of the table to insert rows into.',
            required: true,
            refreshers: ['schema'],
            options: async ({ auth, schema }) => {
                if (!auth || !schema) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please select a schema first.'
                    };
                }
                return await getTables(auth as any, schema as string);
            }
        }),
        rows: Property.Json({
            displayName: 'Rows (JSON Array)',
            description: 'A JSON array of row objects to insert. Each object key should be a column name.',
            required: true,
            defaultValue: [{ "COLUMN1": "value1", "COLUMN2": 123 }],
        }),
    },
    async run(context) {
        const { connectString, username, password, identityDomain } = context.auth;
        const { schema, table, rows } = context.propsValue;

        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            throw new Error("The 'Rows' property must be a non-empty JSON array.");
        }

        const requestBody = rows;

        const url = `${connectString.replace(/\/$/, "")}/${schema}/${table}/`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
        };

        if (identityDomain) {
            headers['X-ID-TENANT-NAME'] = identityDomain;
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
            throw new Error(`Failed to insert rows: ${error.message}`);
        }
    },
});