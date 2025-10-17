import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { oracleAuth } from "../../index";
import { getSchemas, getTables } from "../common/helpers";

export const deleteRow = createAction({
    auth: oracleAuth,
    name: 'delete_row',
    displayName: 'Delete Row(s)',
    description: 'Deletes one or more rows from a table that match a condition.',
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
            description: 'The name of the table to delete rows from.',
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
        where: Property.LongText({
            displayName: 'WHERE Clause',
            description: 'The condition to identify which rows to delete. Example: "EMPLOYEE_ID = 101" or "STATUS = \'INACTIVE\'".',
            required: true,
        })
    },
    async run(context) {
        const { connectString, username, password, identityDomain } = context.auth;
        const { schema, table, where } = context.propsValue;

        if (!where || where.trim() === '') {
            throw new Error("The WHERE clause cannot be empty. This is a safeguard to prevent deleting all rows in a table.");
        }

        const statementText = `DELETE FROM ${table} WHERE ${where}`;
        
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
                    statementText: statementText
                },
            });
            return response.body;
        } catch (error: any) {
            throw new Error(`Failed to delete row(s): ${error.message}`);
        }
    },
});