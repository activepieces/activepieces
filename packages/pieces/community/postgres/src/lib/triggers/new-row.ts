
import { createTrigger, TriggerStrategy, Property, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import crypto from 'crypto';
import { postgresAuth } from '../..';
import { pgClient, postgresCommon } from '../common';
import format from 'pg-format';
import dayjs from 'dayjs';

type OrderDirection = 'ASC' | 'DESC';
const polling: Polling<AppConnectionValueForAuthProperty<typeof postgresAuth>, {
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
    aiMetadata: {
      description: 'Fires when a new row appears in a selected PostgreSQL table, detected by polling and ordering on a chosen column (such as a created timestamp or auto-incrementing ID). Each event represents one newly inserted row and carries that row\'s data.',
    },
    props: {
        description: Property.MarkDown({
            value: `**NOTE:** The trigger fetches the latest rows using the provided order by column (newest first), and then will keep polling until the previous last row is reached.`,
        }),
        table: postgresCommon.table,
        order_by: postgresCommon.column({
            displayName: 'Column to order by',
            description: 'Use something like a created timestamp or an auto-incrementing ID.',
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
