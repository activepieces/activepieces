import { Property, createAction } from "@activepieces/pieces-framework";
import { codaAuth } from "../..";
import { CodaTableReference, codaClient, CodaGetTableDetailsResponse } from "../common/common";

export const findTable = createAction({
    auth: codaAuth,
    name: 'find_table',
    displayName: 'Find Table(s)',
    description: 'List tables in a selected document. Automatically handles pagination to retrieve all tables.',
    props: {
        docId: Property.ShortText({
            displayName: 'Document ID',
            description: 'The ID of the Coda document.',
            required: true,
        }),
        limit: Property.Number({
            displayName: 'Page Size (Limit per API call)',
            description: 'Maximum number of results to return per API call during pagination (default is Coda API default).',
            required: false,
        }),
        sortBy: Property.StaticDropdown({
            displayName: 'Sort By',
            description: 'Determines how to sort the given objects.',
            required: false,
            options: {
                options: [
                    { label: 'Name', value: 'name' },
                ]
            }
        }),
        tableTypes: Property.StaticMultiSelectDropdown({
            displayName: 'Table Types',
            description: 'Select table types to include in results (default: all).',
            required: false,
            options: {
                options: [
                    { label: 'Table', value: 'table' },
                    { label: 'View', value: 'view' },
                ]
            }
        }),
    },
    async run(context) {
        const { docId, limit, sortBy, tableTypes } = context.propsValue;
        const client = codaClient(context.auth);

        const tableTypesString = tableTypes && tableTypes.length > 0 ? tableTypes.join(',') : undefined;

        let allTables: CodaTableReference[] = [];
        let nextPageToken: string | undefined = undefined;

        do {
            const response = await client.listTables(docId, {
                limit: limit, // User-defined limit here acts as page size
                sortBy: sortBy as string | undefined,
                tableTypes: tableTypesString,
                pageToken: nextPageToken,
            });

            if (response.items) {
                allTables = allTables.concat(response.items);
            }
            nextPageToken = response.nextPageToken;

        } while (nextPageToken);

        return {
            tables: allTables
        };
    }
});

export const getTableDetails = createAction({
    auth: codaAuth,
    name: 'get_table_details',
    displayName: 'Get Table Details',
    description: 'Get structure and details of a specific table (e.g., columns, schema).',
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
        useUpdatedTableLayouts: Property.Checkbox({
            displayName: 'Use Updated Table Layouts',
            description: 'Return "detail" and "form" for the layout field of detail and form layouts respectively (instead of "masterDetail" for both).',
            required: false,
        })
    },
    async run(context): Promise<CodaGetTableDetailsResponse> {
        const { docId, tableIdOrName, useUpdatedTableLayouts } = context.propsValue;
        const client = codaClient(context.auth);

        return await client.getTableDetails(docId, tableIdOrName, {
            useUpdatedTableLayouts: useUpdatedTableLayouts
        });
    }
});
