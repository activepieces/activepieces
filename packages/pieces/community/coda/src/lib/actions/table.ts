import { Property, createAction, DynamicPropsValue } from "@activepieces/pieces-framework";
import { codaAuth } from "../..";
import { CodaTableReference, codaClient, CodaGetTableDetailsResponse } from "../common/common";

export const findTable = createAction({
    auth: codaAuth,
    name: 'find_table',
    displayName: 'Find Table(s)',
    description: 'List tables in a selected document. Automatically handles pagination to retrieve all tables.',
    props: {
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
        const client = codaClient(context.auth as string);

        const tableTypesString = tableTypes && (tableTypes as string[]).length > 0 ? (tableTypes as string[]).join(',') : undefined;

        let allTables: CodaTableReference[] = [];
        let nextPageToken: string | undefined = undefined;

        do {
            const response = await client.listTables(docId as string, {
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
            description: 'The table to get details for.',
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
        useUpdatedTableLayouts: Property.Checkbox({
            displayName: 'Use Updated Table Layouts',
            description: 'Return "detail" and "form" for the layout field of detail and form layouts respectively (instead of "masterDetail" for both).',
            required: false,
        })
    },
    async run(context): Promise<CodaGetTableDetailsResponse> {
        const { docId, tableIdOrName, useUpdatedTableLayouts } = context.propsValue;
        const client = codaClient(context.auth as string);

        return await client.getTableDetails(docId as string, tableIdOrName as string, {
            useUpdatedTableLayouts: useUpdatedTableLayouts
        });
    }
});
