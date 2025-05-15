import { PiecePropValueSchema, Property, TriggerStrategy, createTrigger, StaticPropsValue, DynamicPropsValue } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { codaAuth } from '../..';
import { CodaRow, codaClient } from '../common/common';
import dayjs from 'dayjs';

const props = {
    docId: Property.Dropdown({
        displayName: 'Document',
        description: 'The Coda document.',
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: 'Connect your Coda account first',
                    options: []
                };
            }
            const client = codaClient(auth as string);
            let docs: { label: string, value: string }[] = [];
            let nextPageToken: string | undefined = undefined;
            try {
                do {
                    const response = await client.listDocs({ limit: 100, pageToken: nextPageToken });
                    if (response.items) {
                        docs = docs.concat(response.items.map(doc => ({
                            label: doc.name,
                            value: doc.id
                        })));
                    }
                    nextPageToken = response.nextPageToken;
                } while (nextPageToken);

                return {
                    disabled: false,
                    options: docs
                };
            } catch (error) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: "Error listing docs, please check connection or API key permissions."
                }
            }
        }
    }),
    tableIdOrName: Property.Dropdown({
        displayName: 'Table',
        description: 'The table to watch for new rows.',
        required: true,
        refreshers: ['docId'],
        options: async ({ auth, docId }) => {
            if (!auth || !docId) {
                return {
                    disabled: true,
                    placeholder: !auth ? 'Connect your Coda account first' : 'Select a document first',
                    options: []
                };
            }
            const client = codaClient(auth as string);
            let tables: { label: string, value: string }[] = [];
            let nextPageToken: string | undefined = undefined;

            try {
                do {
                    const response = await client.listTables(docId as string, { limit: 100, pageToken: nextPageToken });
                    if (response.items) {
                        tables = tables.concat(response.items.map(table => ({
                            label: table.name,
                            value: table.id
                        })));
                    }
                    nextPageToken = response.nextPageToken;
                } while (nextPageToken);

                return {
                    disabled: false,
                    options: tables
                };
            } catch (error) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: "Error listing tables. Check document ID or permissions."
                }
            }
        }
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
        description: 'Output column data using names instead of IDs. If unchecked, column IDs will be used.',
        required: false,
        defaultValue: false,
    }),
};

// Define the type for propsValue within the polling context
type PollingProps = StaticPropsValue<typeof props>;

const polling: Polling<PiecePropValueSchema<typeof codaAuth>, PollingProps> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const client = codaClient(auth as string); // auth is the API key string

        // Coda API sorts by createdAt ascending by default.
        // We need to fetch all and then filter, or see if Coda supports a query like `createdAt > timestamp`.
        // For now, fetching with sort and paginating then filtering.
        // Coda's `query` param is `column:value`, not ideal for `>` comparisons on timestamps directly.

        let allFetchedRows: CodaRow[] = [];
        let nextPageToken: string | undefined = undefined;

        // We will sort by createdAt to process in order. The API default is ascending.
        do {
            const response = await client.listRows(propsValue.docId as string, propsValue.tableIdOrName as string, {
                sortBy: 'createdAt', // Default is ascending
                valueFormat: propsValue.valueFormat as string | undefined, // This should be the string value
                useColumnNames: propsValue.useColumnNames,
                limit: 100, // Sensible limit for polling fetches
                pageToken: nextPageToken,
            });

            if (response.items) {
                allFetchedRows = allFetchedRows.concat(response.items);
            }
            nextPageToken = response.nextPageToken;
        } while (nextPageToken);

        const newRows = allFetchedRows.filter(row => {
            const createdAtEpoch = dayjs(row.createdAt).valueOf();
            return createdAtEpoch > lastFetchEpochMS;
        });

        return newRows.map((row) => {
            return {
                epochMilliSeconds: dayjs(row.createdAt).valueOf(),
                data: row,
            };
        });
    }
};

export const newRowCreated = createTrigger({
    auth: codaAuth,
    name: 'new_row_created',
    displayName: 'New Row Created',
    description: 'Triggers when a new row is created in a Coda table.',
    props: props,
    type: TriggerStrategy.POLLING,
    sampleData: {
        id: "i-xxxxxxx",
        type: "row",
        href: "https://coda.io/apis/v1/docs/docId/tables/tableId/rows/rowId",
        name: "Sample Row Name",
        index: 1,
        browserLink: "https://coda.io/d/docId/tableId#_rui-xxxxxxx",
        createdAt: "2023-01-01T12:00:00.000Z",
        updatedAt: "2023-01-01T12:00:00.000Z",
        values: { "c-columnId1": "Sample Value", "Column Name 2": 123 },
        parentTable: {
          id: "grid-parentTableId123",
          type: "table",
          name: "Parent Table Name",
          href: "https://coda.io/apis/v1/docs/docId/tables/grid-parentTableId123"
        }
    },
    onEnable: async (context) => {
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
    },
    run: async (context) => {
        return await pollingHelper.poll(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue as PollingProps,
            files: context.files, // files is not used by this polling logic but required by helper type
        });
    },
    test: async (context) => {
        // For testing, fetch the latest few rows without relying on lastFetchEpochMS
        const client = codaClient(context.auth as string);
        const response = await client.listRows(context.propsValue.docId as string, context.propsValue.tableIdOrName as string, {
            sortBy: 'createdAt', // Get newest first for test
            limit: 5, // Fetch a few sample items
            valueFormat: context.propsValue.valueFormat as string | undefined,
            useColumnNames: context.propsValue.useColumnNames,
        });
        // The API sorts ascending, so to get latest for sample, we'd need to reverse or fetch last page.
        // For simplicity, returning up to 5 of the oldest if sorted ascending, or newest if Coda API allowed sort direction.
        // Coda API seems to return rows sorted by `createdAt` in ascending order by default.
        // To get the *newest* for the sample, we'd ideally sort descending or fetch the last page.
        // For now, returning the first few fetched which will be the oldest if sorted ascending.
        // A better test might involve fetching a larger set and taking the last few.

        // To get *actually* new items for test, let's get the last page or sort descending if possible.
        // Since Coda sorts 'createdAt' ascending by default and doesn't offer explicit descending on listRows,
        // we'll fetch, and if there are many, we'd ideally get the *last* page.
        // For a simple test, we'll just return the first few (oldest). A more robust test might be needed.

        // Let's try to get the most recent items for the test more reliably.
        // Fetch a page of items sorted by createdAt (ascending is default)
        // If there's a nextPageToken, it means there are more items, and the current ones are older.
        // The most robust way without knowing total count or having descending sort is to fetch all then take last N.
        // This is too much for a test. So we will take first N from ascending sort (oldest of the newest batch).

        // Simplified test: get a few rows, newest if API allowed DESC, otherwise some recent ones.
        // Since Coda sorts `createdAt` ascending, and we don't have an easy way to get the *last* page for a test sample without fetching all,
        // we will return the first few rows, which are the oldest. This is not ideal for showcasing "new" data.
        // A better approach might be to always fetch with limit and if count is limit, indicate more might exist.
        // For a simple test: just return up to 5 rows. The user will see these are Coda rows.
        const testRows = response.items || [];
        return testRows.slice(0, 5); // Return up to 5 rows for the test sample.
    }
});
