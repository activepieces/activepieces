
import { createTrigger, TriggerStrategy, Property, AppConnectionValueForAuthProperty, MarkdownVariant } from '@activepieces/pieces-framework';
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
                const value = row[propsValue.order_by];
                const orderValue = value instanceof Date && dayjs(value).isValid() ? dayjs(value).toISOString() : value;
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
    classification: 'READ',
    auth: postgresAuth,
    displayName: 'New Row',
    description: 'Triggers when a new row is added to a table',
    aiMetadata: {
      description: 'Fires when a new row appears in a selected PostgreSQL table, detected by polling and ordering on a chosen column (such as a created timestamp or auto-incrementing ID). Each event represents one newly inserted row and carries that row\'s data.',
    },
    props: {
        description: Property.MarkDown({
            value: 'Each check reads rows in the order below and stops at the last row it already saw.',
            variant: MarkdownVariant.INFO,
        }),
        table: postgresCommon.table,
        order_by: postgresCommon.column({
            displayName: 'Order By Column',
            description: 'Use a created timestamp or an auto-increment ID.',
        }),
        order_direction: Property.StaticDropdown<OrderDirection>({
            displayName: 'Order Direction',
            description: 'Descending when newer rows have larger values, like dates and IDs.',
            required: true,
            display: 'cards',
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
    propertyGroups: [
        { key: 'table', display: 'section', label: 'What to watch', icon: 'inbox', props: ['table'] },
        { key: 'order', display: 'section', label: 'Finding new rows', icon: 'sliders', props: ['description', 'order_by', 'order_direction'] },
    ],
    sampleData: {},
    type: TriggerStrategy.POLLING,
    async test(context) {
        return await pollingHelper.test(polling, context);
    },
    async onEnable(context) {
        await pollingHelper.onEnable(polling, context);
    },

    async onDisable(context) {
        await pollingHelper.onDisable(polling, context);
    },

    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});
