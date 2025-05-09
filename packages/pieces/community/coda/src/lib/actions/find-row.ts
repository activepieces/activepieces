import { Property, createAction } from "@activepieces/pieces-framework";
import { codaAuth } from "../..";
import { CodaRow, codaClient } from "../common/common";

export const findRow = createAction({
    auth: codaAuth,
    name: 'find_row',
    displayName: 'Find Row(s)',
    description: 'Find specific rows in a table based on filters. Handles pagination to retrieve all matching rows.',
    props: {
        docId: Property.ShortText({
            displayName: 'Document ID',
            description: 'The ID of the Coda document.',
            required: true,
        }),
        tableIdOrName: Property.ShortText({
            displayName: 'Table ID or Name',
            description: 'The ID or name of the table. If using a name, ensure it is URI encoded.',
            required: true,
        }),
        query: Property.ShortText({
            displayName: 'Query',
            description: 'Filter rows, e.g., `columnIdOrName:"Value"`. Quote names and string values.',
            required: false,
        }),
        sortBy: Property.StaticDropdown({
            displayName: 'Sort By',
            description: 'Sort order for the returned rows.',
            required: false,
            options: {
                options: [
                    { label: 'Created At', value: 'createdAt' },
                    { label: 'Natural', value: 'natural' }, // Note: implies visibleOnly=true
                    { label: 'Updated At', value: 'updatedAt' },
                ]
            }
        }),
        useColumnNames: Property.Checkbox({
            displayName: 'Use Column Names in Output',
            description: 'Output column data using names instead of IDs.',
            required: false,
        }),
        valueFormat: Property.StaticDropdown({
            displayName: 'Value Format',
            description: 'The format for cell values in the response.',
            required: false,
            options: {
                options: [
                    { label: 'Simple', value: 'simple' },
                    { label: 'Simple with Arrays', value: 'simpleWithArrays' },
                    { label: 'Rich', value: 'rich' },
                ]
            }
        }),
        visibleOnly: Property.Checkbox({
            displayName: 'Visible Rows Only',
            description: 'Return only visible rows and columns for the table.',
            required: false,
        }),
        limit: Property.Number({
            displayName: 'Page Size (Limit per API call)',
            description: 'Max results per API call during pagination (default is Coda API default).',
            required: false,
        }),
        syncToken: Property.ShortText({
            displayName: 'Sync Token',
            description: 'Token for incremental updates since the last call that generated this token.',
            required: false,
        }),
    },
    async run(context) {
        const { docId, tableIdOrName, query, sortBy, useColumnNames, valueFormat, visibleOnly, limit, syncToken } = context.propsValue;
        const client = codaClient(context.auth);

        let allRows: CodaRow[] = [];
        let nextPageToken: string | undefined = undefined;
        let lastNextSyncToken: string | undefined = undefined;
        // Use initial sync token only for the first call in a paginated sequence if provided
        let useSyncTokenForCurrentCall: string | undefined = syncToken;

        if (sortBy === 'natural' && visibleOnly === false) {
            // Coda docs: "Natural" sort ordering ... will imply visibleOnly=true.
            // If you pass sortBy=natural and visibleOnly=false explicitly, this will result in a Bad Request error
            // We could add a warning or throw an error here before calling the API.
        }

        do {
            const response = await client.listRows(docId, tableIdOrName, {
                query: query,
                sortBy: sortBy as string | undefined,
                useColumnNames: useColumnNames,
                valueFormat: valueFormat as string | undefined,
                visibleOnly: visibleOnly,
                limit: limit,
                pageToken: nextPageToken,
                syncToken: useSyncTokenForCurrentCall,
            });

            if (response.items) {
                allRows = allRows.concat(response.items);
            }
            nextPageToken = response.nextPageToken;
            if(response.nextSyncToken){
                lastNextSyncToken = response.nextSyncToken;
            }

            // After the first call, we should not use the initial syncToken for subsequent paginated calls
            if(useSyncTokenForCurrentCall) {
                useSyncTokenForCurrentCall = undefined;
            }

        } while (nextPageToken);

        return {
            rows: allRows,
            nextSyncToken: lastNextSyncToken // Return the sync token from the last page for future use.
        };
    }
});
