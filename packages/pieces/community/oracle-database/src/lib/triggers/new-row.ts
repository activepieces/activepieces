import { createTrigger, Property, TriggerStrategy } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { oracleAuth } from "../../index";
import { getSchemas, getTables } from "../common/helpers";


async function executeQuery(auth: any, schema: string, statement: string) {
    const { connectString, username, password, identityDomain } = auth;
    const url = `${connectString.replace(/\/$/, "")}/${schema}/_/sql`;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
    };
    if (identityDomain) {
        headers['X-ID-TENANT-NAME'] = identityDomain;
    }
    const response = await httpClient.sendRequest<{ items: { resultSet?: { items: unknown[] } }[] }>({
        method: HttpMethod.POST,
        url,
        headers,
        body: { statementText: statement },
    });
    return response.body?.items?.[0]?.resultSet?.items ?? [];
}

export const newRow = createTrigger({
    auth: oracleAuth,
    name: 'new_row',
    displayName: 'New Row',
    description: 'Triggers when a new row is created in a table.',
    type: TriggerStrategy.POLLING,
    props: {
        schema: Property.Dropdown({
            displayName: 'Schema',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first.' };
                return await getSchemas(auth as any);
            }
        }),
        table: Property.Dropdown({
            displayName: 'Table',
            required: true,
            refreshers: ['schema'],
            options: async ({ auth, schema }) => {
                if (!auth || !schema) return { disabled: true, options: [], placeholder: 'Select a schema first.' };
                return await getTables(auth as any, schema as string);
            }
        }),
        unique_key: Property.ShortText({
            displayName: 'Unique Key Column',
            description: 'A column with unique, ordered values (e.g., a primary key ID or a creation timestamp) to detect new rows.',
            required: true,
        }),
        where: Property.LongText({
            displayName: 'WHERE Clause',
            description: 'An optional SQL WHERE clause to filter rows. Do not include the "WHERE" keyword.',
            required: false,
        }),
    },

    async onEnable(context) {
        const { schema, table, unique_key } = context.propsValue;
        const query = `SELECT ${unique_key} FROM ${table} ORDER BY ${unique_key} DESC FETCH FIRST 1 ROWS ONLY`;
        const rows = await executeQuery(context.auth, schema, query) as Record<string, any>[];
        
        if (rows.length > 0) {
            await context.store.put('lastValue', rows[0][unique_key.toLowerCase()]);
        }
    },

    async onDisable(context) {
    },

    async run(context) {
        const { schema, table, unique_key, where } = context.propsValue;
        const lastValue = await context.store.get('lastValue');

        let query = `SELECT * FROM ${table} WHERE ${unique_key} > ${lastValue ?? 0}`;
        if (where) {
            query += ` AND (${where})`;
        }
        query += ` ORDER BY ${unique_key} ASC`;

        const newRows = await executeQuery(context.auth, schema, query) as Record<string, any>[];

        if (newRows.length > 0) {
            const newLastValue = newRows[newRows.length - 1][unique_key.toLowerCase()];
            await context.store.put('lastValue', newLastValue);
            return newRows;
        }

        return [];
    },

    async test(context) {
        const { schema, table, where } = context.propsValue;
        let query = `SELECT * FROM ${table}`;
        if (where) {
            query += ` WHERE ${where}`;
        }
        query += ` ORDER BY ROWNUM DESC FETCH FIRST 5 ROWS ONLY`;
        
        return await executeQuery(context.auth, schema, query);
    },

    sampleData: {
        "EMPLOYEE_ID": 206,
        "FIRST_NAME": "William",
        "LAST_NAME": "Gietz",
        "EMAIL": "WGIETZ",
        "PHONE_NUMBER": "515.123.8181",
        "HIRE_DATE": "2002-06-07T00:00:00.000Z",
        "JOB_ID": "AC_ACCOUNT",
        "SALARY": 8300,
        "COMMISSION_PCT": null,
        "MANAGER_ID": 205,
        "DEPARTMENT_ID": 110
    }
});