import { createTrigger, TriggerStrategy, Property, MarkdownVariant } from '@activepieces/pieces-framework';
import { postgresAuth } from '../auth';
import { pgClient, postgresCommon } from '../common';
import { newRowPoller, OrderDirection } from '../new-row-poller';

export const newRow = createTrigger({
    name: 'new-row',
    classification: 'READ',
    auth: postgresAuth,
    displayName: 'New Row',
    description: 'Triggers when a new row is added to a table',
    aiMetadata: {
      description: "Fires once for each new row in a PostgreSQL table, found by polling on an order column (a created timestamp or auto-increment ID). Each event is one row's column values. Rows that share an order value each fire; edits do not re-fire when the table has a primary key. Rows with an empty, infinite or NaN order value are skipped, and future timestamptz or date values wait until they are reached; at most 500 rows per check, oldest first.",
    },
    props: {
        description: Property.MarkDown({
            value: "**How it works**\n- Each check delivers rows whose order value is newer than the last row delivered: up to 500 per check, the oldest first; the rest follow on the next check. Within a check, flows run newest first.\n- Rows that share a value each fire once. Rows with an empty, infinite or NaN value are skipped.\n- With Descending order on a `timestamptz` or `date` column, a future-dated row waits until the database's current time reaches it. Columns without a time zone (`timestamp`) are not held back.\n\n**Limits**\n- Edits don't fire a row again when the table has a primary key. Without one, rows are tracked by content and storage position: any UPDATE of a row at the newest value (even one that changes nothing), VACUUM FULL or CLUSTER can fire rows at that value again, and a new row identical to a deleted one that reuses its storage slot can be missed.\n- When more than 2,000 rows share one value, a later row with that value fires only if it sorts after the last row delivered (by primary key, or by storage position without one, so VACUUM, VACUUM FULL or CLUSTER can hide it).\n- A row whose transaction commits after a newer row was delivered can be missed.\n- Without a primary key, rows are matched by their text form, which for `timestamptz` columns depends on the connection's time zone: if it changes, rows at the newest value can fire once more.\n- On a `timestamp` column, a row dated in the future moves the trigger ahead, and rows dated before it are missed.",
            variant: MarkdownVariant.INFO,
        }),
        table: postgresCommon.table,
        order_by: postgresCommon.column({
            displayName: 'Order By Column',
            description: 'Use a created timestamp or an auto-increment ID. Ordering by an updated-at column runs the flow again when a row\'s value moves past the newest one.',
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
        const client = await pgClient(context.auth);
        try {
            return await newRowPoller.sample({ client, settings: { table: context.propsValue.table, orderBy: context.propsValue.order_by, direction: context.propsValue.order_direction } });
        } finally {
            await client.end();
        }
    },
    async onEnable(context) {
        const client = await pgClient(context.auth);
        try {
            await newRowPoller.enable({ client, store: context.store, isRepublish: context.isRepublish === true, settings: { table: context.propsValue.table, orderBy: context.propsValue.order_by, direction: context.propsValue.order_direction } });
        } finally {
            await client.end();
        }
    },
    async onDisable() {
        return;
    },
    async run(context) {
        const client = await pgClient(context.auth);
        try {
            return await newRowPoller.poll({ client, store: context.store, settings: { table: context.propsValue.table, orderBy: context.propsValue.order_by, direction: context.propsValue.order_direction } });
        } finally {
            await client.end();
        }
    },
});
