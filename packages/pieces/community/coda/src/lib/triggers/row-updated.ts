import { PiecePropValueSchema, Property, TriggerStrategy, createTrigger, StaticPropsValue } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { codaAuth } from '../..';
import { CodaRow, codaClient } from '../common/common';
import dayjs from 'dayjs';

const SYNC_TOKEN_STORE_KEY = 'last_sync_token';

const props = {
    docId: Property.ShortText({
        displayName: 'Document ID',
        description: 'The ID of the Coda document.',
        required: true,
    }),
    tableIdOrName: Property.ShortText({
        displayName: 'Table ID or Name',
        description: 'The ID or name of the table to watch for updated rows. If using a name, ensure it is URI encoded.',
        required: true,
    }),
    // Optional query to focus on specific rows, though syncToken might make this complex
    query: Property.ShortText({
        displayName: 'Query (Optional)',
        description: 'Filter for specific rows to watch, e.g., `columnIdOrName:"Value"`. Note: syncToken behavior with queries needs careful consideration.',
        required: false,
    }),
    valueFormat: Property.StaticDropdown({
        displayName: 'Value Format',
        description: 'The format for cell values in the returned row data.',
        required: false,
        options: {
            options: [
                { label: 'Simple', value: 'simple' },
                { label: 'Simple with Arrays', value: 'simpleWithArrays' },
                { label: 'Rich', value: 'rich' },
            ]
        }
    }),
    useColumnNames: Property.Checkbox({
        displayName: 'Use Column Names in Output (Optional)',
        description: 'Output column data using names instead of IDs.',
        required: false,
    }),
};

type PollingProps = StaticPropsValue<typeof props>;

const polling: Polling<PiecePropValueSchema<typeof codaAuth>, PollingProps> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, store, lastFetchEpochMS }) => {
        const client = codaClient(auth);
        const storedSyncToken = await store.get<string | null>(SYNC_TOKEN_STORE_KEY); // Explicitly allow null from store
        const syncTokenForCall = storedSyncToken || undefined; // Convert null to undefined

        let allUpdatedRows: CodaRow[] = [];
        let nextPageToken: string | undefined = undefined;
        let currentBatchNextSyncToken: string | undefined;

        do {
            const response = await client.listRows(propsValue.docId, propsValue.tableIdOrName, {
                sortBy: 'updatedAt', // Coda sorts ascending by default
                query: propsValue.query,
                valueFormat: propsValue.valueFormat,
                useColumnNames: propsValue.useColumnNames,
                limit: 100, // Sensible limit for polling fetches
                pageToken: nextPageToken,
                syncToken: nextPageToken ? undefined : syncTokenForCall, // Only use syncToken on the first call of a potential multi-page fetch
            });

            if (response.items) {
                allUpdatedRows = allUpdatedRows.concat(response.items);
            }
            nextPageToken = response.nextPageToken;
            if (response.nextSyncToken) { // Capture the latest sync token from this batch
                currentBatchNextSyncToken = response.nextSyncToken;
            }

        } while (nextPageToken);

        if (currentBatchNextSyncToken) {
            await store.put(SYNC_TOKEN_STORE_KEY, currentBatchNextSyncToken);
        }

        const updatedRowsSinceLastPoll = allUpdatedRows.filter(row => {
            const updatedAtEpoch = dayjs(row.updatedAt).valueOf();
            // Primary condition: row must be updated after the last poll's latest item time.
            // Also, ensure it wasn't just created now if it matches lastFetchEpochMS exactly (edge case for new items appearing in update poll).
            return updatedAtEpoch > lastFetchEpochMS ||
                   (updatedAtEpoch === lastFetchEpochMS && dayjs(row.createdAt).valueOf() < lastFetchEpochMS);
        });

        return updatedRowsSinceLastPoll.map((row) => {
            return {
                epochMilliSeconds: dayjs(row.updatedAt).valueOf(),
                data: row,
            };
        });
    }
};

export const rowUpdated = createTrigger({
    auth: codaAuth,
    name: 'row_updated',
    displayName: 'Row Updated',
    description: 'Triggers when a row is updated in a Coda table.',
    props: props,
    type: TriggerStrategy.POLLING,
    sampleData: {
        id: "i-xxxxxxx",
        type: "row",
        href: "https://coda.io/apis/v1/docs/docId/tables/tableId/rows/rowId",
        name: "Sample Updated Row",
        index: 1,
        browserLink: "https://coda.io/d/docId/tableId#_rui-xxxxxxx",
        createdAt: "2023-01-01T11:00:00.000Z",
        updatedAt: "2023-01-01T12:05:00.000Z", // Updated time is later
        values: { "c-columnId1": "Updated Value", "Column Name 2": 456 }
    },
    onEnable: async (context) => {
        // Initialize syncToken if it doesn't exist, or we might fetch too much on first run
        const currentSyncToken = await context.store.get<string | null>(SYNC_TOKEN_STORE_KEY);
        if (currentSyncToken === null || currentSyncToken === undefined) {
            // Fetch a current sync token to start with to avoid processing all historical data as "updated"
            // This initial fetch is just to get a baseline sync token.
            try {
                const client = codaClient(context.auth);
                const response = await client.listRows(context.propsValue.docId, context.propsValue.tableIdOrName, { limit: 1 });
                if (response.nextSyncToken) {
                    await context.store.put(SYNC_TOKEN_STORE_KEY, response.nextSyncToken);
                }
            } catch (e) {
                console.warn("Coda - Row Updated Trigger: Failed to pre-fetch initial sync token during onEnable. Will rely on time-based polling for the first run.", e);
                // If it fails, we proceed without a sync token, and time-based polling will take over for the first run.
            }
        }
        await pollingHelper.onEnable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue as PollingProps,
        });
    },
    onDisable: async (context) => {
        await pollingHelper.onDisable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue as PollingProps,
        });
        // Optionally, clear the stored sync token, though it might be useful if the flow is re-enabled soon.
        // await context.store.delete(SYNC_TOKEN_STORE_KEY);
    },
    run: async (context) => {
        return await pollingHelper.poll(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue as PollingProps,
            files: context.files,
        });
    },
    test: async (context) => {
        const client = codaClient(context.auth);
        const response = await client.listRows(context.propsValue.docId, context.propsValue.tableIdOrName, {
            sortBy: 'updatedAt',
            limit: 5,
            valueFormat: context.propsValue.valueFormat,
            useColumnNames: context.propsValue.useColumnNames,
            query: context.propsValue.query
        });
        return (response.items || []).slice(0,5);
    }
});
