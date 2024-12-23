
import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import crypto from 'crypto';
import { postgresAuth } from '../..';
import { pgClient } from '../common';
import format from 'pg-format';
import dayjs from 'dayjs';

type OrderDirection = 'ASC' | 'DESC';
const polling: Polling<PiecePropValueSchema<typeof postgresAuth>, {
    table: {
        table_schema: string,
        table_name: string
    }, order_by: string, order_direction: OrderDirection | undefined
}> = {
    strategy: DedupeStrategy.LAST_ITEM,
    items: async ({ auth, propsValue, lastItemId }) => {
        const client = await pgClient(auth)
        try {
            const lastItem = lastItemId as string;
            const query = constructQuery({ table: propsValue.table, order_by: propsValue.order_by, lastItem: lastItem, order_direction: propsValue.order_direction })
            const result = await client.query(query);
            const items = result.rows.map(function (row) {
                const rowHash = crypto.createHash('md5').update(JSON.stringify(row)).digest('hex');
                const isTimestamp = dayjs(row[propsValue.order_by]).isValid();
                const orderValue = isTimestamp ? dayjs(row[propsValue.order_by]).toISOString() : row[propsValue.order_by];
                return {
                    id: orderValue + '|' + rowHash,
                    data: row,
                }
            });

            return items;
        } finally {
            await client.end();
        }
    }
};

function constructQuery({ table, order_by, lastItem, order_direction }: { table: { table_name: string, table_schema: string }, order_by: string, order_direction: OrderDirection | undefined, lastItem: string }): string {
    const lastOrderKey = (lastItem ? lastItem.split('|')[0] : null);
    if (lastOrderKey === null) {
        switch (order_direction) {
            case 'ASC':
                return format(`SELECT * FROM %I.%I ORDER BY %I ASC LIMIT 5`, table.table_schema, table.table_name, order_by);
            case 'DESC':
                return format(`SELECT * FROM %I.%I ORDER BY %I DESC LIMIT 5`, table.table_schema, table.table_name, order_by);
            default:
                throw new Error(JSON.stringify({
                    message: 'Invalid order direction',
                    order_direction: order_direction,
                }));
        }
    } else {
        switch (order_direction) {
            case 'ASC':
                return format(`SELECT * FROM %I.%I WHERE %I <= %L ORDER BY %I ASC`, table.table_schema, table.table_name, order_by, lastOrderKey, order_by);
            case 'DESC':
                return format(`SELECT * FROM %I.%I WHERE %I >= %L ORDER BY %I DESC`, table.table_schema, table.table_name, order_by, lastOrderKey, order_by);
            default:
                throw new Error(JSON.stringify({
                    message: 'Invalid order direction',
                    order_direction: order_direction,
                }));
        }
    }
}

export const newRow = createTrigger({
    name: 'new-row',
    auth: postgresAuth,
    displayName: 'New Row',
    description: 'triggered when a new row is added',
    props: {
        description: Property.MarkDown({
            value: `**NOTE:** The trigger fetches the latest rows using the provided order by column (newest first), and then will keep polling until the previous last row is reached.`,
        }),
        table: Property.Dropdown({
            displayName: 'Table name',
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
                try {
                    const result = await client.query(
                        `SELECT table_schema, table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE'`
                    );
                    const options = result.rows.map(row => ({
                        label: `${row.table_schema}.${row.table_name}`,
                        value: {
                            table_schema: row.table_schema,
                            table_name: row.table_name,
                        },
                    }));
                    return {
                        disabled: false,
                        options,
                    };
                } finally {
                    await client.end();
                }
            }
        }),
        order_by: Property.Dropdown({
            displayName: 'Column to order by',
            description: 'Use something like a created timestamp or an auto-incrementing ID.',
            required: true,
            refreshers: ['table'],
            refreshOnSearch: false,
            options: async ({ auth, table }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please authenticate first',
                    };
                }
                if (!table) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please select a table',
                    };
                }
                const authProps = auth as PiecePropValueSchema<typeof postgresAuth>;
                const client = await pgClient(authProps)
                try {
                    const { table_name, table_schema } = table as { table_schema: string, table_name: string };
                    const query = `
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = $1
                    AND table_name = $2
                `;
                    const params = [table_schema, table_name];
                    const result = await client.query(query, params);

                    const options = result.rows.map(f => {
                        return {
                            label: f.column_name,
                            value: f.column_name,
                        };
                    })
                    return {
                        disabled: false,
                        options,
                    };
                } finally {
                    await client.end();
                }
            }
        }),
        order_direction: Property.StaticDropdown<OrderDirection>({
            displayName: 'Order Direction',
            description: 'The direction to sort by such that the newest rows are fetched first.',
            required: true,
            options: {
                options: [
                    {
                        label: 'Ascending',
                        value: 'ASC',
                    },
                    {
                        label: 'Descending',
                        value: 'DESC',
                    },
                ]
            },
            defaultValue: 'DESC',
        }),
    },
    sampleData: {},
    type: TriggerStrategy.POLLING,
    async test(context) {
        return await pollingHelper.test(polling, context);
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
        return await pollingHelper.poll(polling, context);
    },
});
