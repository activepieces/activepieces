import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { oracleAuth } from "../../index";
import { getSchemas, getTables } from "../common/helpers";

export const findRow = createAction({
    auth: oracleAuth,
    name: 'find_row',
    displayName: 'Find Row(s)',
    description: 'Finds one or more rows in a table based on a filter condition.',
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
            description: 'The name of the table to search in.',
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
            description: 'The condition to filter rows. Example: "STATUS = \'ACTIVE\'". If left empty, all rows will be returned (up to the specified limit).',
            required: false,
        }),
        limit: Property.Number({
            displayName: 'Limit',
            description: 'The maximum number of rows to return. Appends a `FETCH FIRST N ROWS ONLY` clause (requires Oracle 12c+).',
            required: false,
        })
    },
    async run(context) {
        const { connectString, username, password, identityDomain } = context.auth;
        const { schema, table, where, limit } = context.propsValue;

        let statementText = `SELECT * FROM ${table}`;

        if (where && where.trim() !== '') {
            statementText += ` WHERE ${where}`;
        }

        if (limit) {
            statementText += ` FETCH FIRST ${limit} ROWS ONLY`;
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
            const response = await httpClient.sendRequest<{ items: { resultSet?: { items: unknown[] } }[] }>({
                method: HttpMethod.POST,
                url: url,
                headers: headers,
                body: {
                    statementText: statementText
                },
            });

            const foundRows = response.body?.items?.[0]?.resultSet?.items ?? [];
            
            return {
                rows: foundRows
            };

        } catch (error: any) {
            throw new Error(`Failed to find row(s): ${error.message}`);
        }
    },
});