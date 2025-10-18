import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { oracleAuth } from "../../index";
import { getSchemas, getTables } from "../common/helpers";

export const updateRow = createAction({
    auth: oracleAuth,
    name: 'update_row',
    displayName: 'Update Row(s)',
    description: 'Updates one or more rows in a table that match a filter condition.',
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
            description: 'The name of the table to update.',
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
        update_values: Property.Json({
            displayName: 'Update Values',
            description: 'A JSON object where keys are column names and values are the new data to set.',
            required: true,
            defaultValue: { "COLUMN_TO_UPDATE": "new_value" }
        }),
        where: Property.LongText({
            displayName: 'WHERE Clause',
            description: 'The WHERE clause to identify which rows to update. Example: "EMPLOYEE_ID = 100". **Warning: If left empty, all rows in the table will be updated.**',
            required: false,
        })
    },
    async run(context) {
        const { connectString, username, password, identityDomain } = context.auth;
        const { schema, table, update_values, where } = context.propsValue;

        if (!update_values || Object.keys(update_values).length === 0) {
            throw new Error("The 'Update Values' object cannot be empty.");
        }

        const setClauses: string[] = [];
        const binds: { name: string; value: any; data_type: string }[] = [];
        let bindCounter = 1;

        for (const [key, value] of Object.entries(update_values)) {
            const bindName = `p${bindCounter++}`;
            setClauses.push(`${key} = :${bindName}`);
            
            const dataType = typeof value === 'number' ? 'NUMBER' : 'VARCHAR2';

            binds.push({
                name: bindName,
                value: value,
                data_type: dataType
            });
        }
        
        let statementText = `UPDATE ${table} SET ${setClauses.join(', ')}`;
        if (where) {
            statementText += ` WHERE ${where}`;
        }
        
        const url = `${connectString.replace(/\/$/, "")}/${schema}/_/sql`;

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
                body: {
                    statementText: statementText,
                    binds: binds,
                },
            });
            return response.body;
        } catch (error: any) {
            throw new Error(`Failed to update row(s): ${error.message}`);
        }
    },
});