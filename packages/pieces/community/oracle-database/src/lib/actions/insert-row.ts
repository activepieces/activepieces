import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { oracleAuth } from "../../index";
import { getSchemas, getTables } from "../common/helpers"; 

export const insertRow = createAction({
    auth: oracleAuth,
    name: 'insert_row',
    displayName: 'Insert Row',
    description: 'Insert a new row into a table.',
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
            description: 'The name of the table to insert the row into.',
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
        row: Property.Json({
            displayName: 'Row Data',
            description: 'A JSON object where keys are column names and values are the data to insert.',
            required: true,
            defaultValue: { "COLUMN_NAME": "value" }
        })
    },
    async run(context) {
        const { connectString, username, password, identityDomain } = context.auth;
        const { schema, table, row } = context.propsValue;

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
                body: row,
            });
            return response.body;
        } catch (error: any) {
            throw new Error(`Failed to insert row: ${error.message}`);
        }
    },
});