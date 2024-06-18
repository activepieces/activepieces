
import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import crypto from 'crypto';
import { postgresAuth } from '../..';
import { Client } from 'pg';

const polling: Polling<PiecePropValueSchema<typeof postgresAuth>, { table_name: string, order_by: string }> = {
    strategy: DedupeStrategy.LAST_ITEM,
    items: async ({ auth, propsValue, lastItemId }) => {
        
        const client = await pgClient(auth)
        const lastItem = lastItemId as string;

        const lastOrderKey = (lastItem ? lastItem.split('|')[0] : null)
        console.log("lastOrderKey=" + lastOrderKey)
        let params = []
        let query = "";
        if (lastOrderKey === null) {
            query = `
                SELECT *
                FROM ${propsValue.table_name}
                ORDER BY $1
                LIMIT 1 DESC
            `;
            params = [propsValue.order_by];
        } else {
            query = `
                SELECT *
                FROM ${propsValue.table_name}
                WHERE $2 >= $1
                ORDER BY $2 DESC
            `;
            params = [lastOrderKey, propsValue.order_by];
        }
        
        const result = await client.query(query, params);

        const items = result.rows.map(function(row){
            console.log("item=" + JSON.stringify(row))
            const rowHash = crypto.createHash('md5').update(JSON.stringify(row)).digest('hex');
            return {
                id: row[propsValue.order_by] + '|' + rowHash,
                data: row,
            }
        });

        await client.end();

        return items;
    }
};

export const createUpdateRow = createTrigger({
    name: 'create-update-row',
    auth: postgresAuth,
    displayName: 'create-update-row',
    description: 'triggered when a new row is created or updated',
    props: {
        table_name: Property.Dropdown({
            displayName: 'Table name',
            description: 'Select a table',
            required: true,
            refreshers: ['auth'],
            refreshOnSearch: false,
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please authenticate first',
                    };
                }
                const authProps = auth as PiecePropValueSchema<typeof postgresAuth>;
                const client = await pgClient(authProps)

                const result = await client.query(
                    `SELECT table_schema, table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE'`
                );

                const options = result.rows.map(row => ({
                    label: `${row.table_schema}.${row.table_name}`,
                    value: `${row.table_schema}.${row.table_name}`,
                }));

                await client.end();

                return {
                    disabled: false,
                    options,
                };
            }
        }),
        order_by: Property.Dropdown({
            displayName: 'Column to order by',
            description: 'Select a column',
            required: true,
            refreshers: ['table_name'],
            refreshOnSearch: false,
            options: async ({ auth, table_name }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please authenticate first',
                    };
                }
                if (!table_name) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please select a table',
                    };
                }
                const authProps = auth as PiecePropValueSchema<typeof postgresAuth>;
                const client = await pgClient(authProps)
                const schemaTableName = table_name as string;

                const [schemaName, tableName] = schemaTableName.split('.');

                const query = `
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = $1
                    AND table_name = $2
                `;
                const params = [schemaName, tableName];


                const result = await client.query(query, params);

                const options = []
                for (const row of result.rows) {
                    options.push({
                        label: row.column_name,
                        value: row.column_name,
                    });
                }

                await client.end();

                return {
                    disabled: false,
                    options,
                };
            }
        }),
    },
    sampleData: {},
    type: TriggerStrategy.POLLING,
    async test(context) {
        const { store, auth, propsValue } = context;
        return await pollingHelper.test(polling, { store, propsValue, auth });
    },
    async onEnable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onEnable(polling, { store, propsValue, auth });
    },

    async onDisable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onDisable(polling, { store, propsValue, auth });
    },

    async run(context) {
        const { store, auth, propsValue } = context;
        return await pollingHelper.poll(polling, { store, propsValue, auth });
    },
});

export const pgClient = async (auth: PiecePropValueSchema<typeof postgresAuth>) => {
    const {
        host,
        user,
        database,
        password,
        port,
        enable_ssl,
        reject_unauthorized: rejectUnauthorized,
        certificate,
    } = auth;

    const sslConf = {
        rejectUnauthorized: rejectUnauthorized,
        ca: certificate && certificate.length > 0 ? certificate : undefined,
    };
    const client = new Client({
        host,
        port: port,
        user,
        password,
        database,
        ssl: enable_ssl ? sslConf : undefined,
    });

    await client.connect();

    return client;
}