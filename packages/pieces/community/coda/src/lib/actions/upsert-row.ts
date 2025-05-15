import { Property, createAction, DynamicPropsValue } from "@activepieces/pieces-framework";
import { codaAuth } from "../..";
import { codaClient } from "../common/common";

export const upsertRow = createAction({
    auth: codaAuth,
    name: 'upsert_row',
    displayName: 'Upsert Row',
    description: 'Insert a new row or update an existing one if it matches key columns.',
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
            description: 'The table for the upsert operation. This action only works for base tables, not views.',
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
                        // Ensure tableTypes is explicitly 'table' as this action doesn't support views
                        const response = await client.listTables(docId as string, { limit: 100, pageToken: nextPageToken, tableTypes: 'table' });
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
        rowData: Property.Json({
            displayName: 'Row Data',
            description: 'Object mapping Column IDs or Names to their values for the row. E.g., `{"Column Name 1": "Value A", "c-123xyz": 42}`',
            required: true,
            defaultValue: {},
        }),
        keyColumns: Property.Array({
            displayName: 'Key Columns',
            description: 'Array of Column IDs or Names to use as keys for the upsert. If a row matches these keys, it will be updated; otherwise, a new row is inserted.',
            required: true,
            defaultValue: []
        }),
        disableParsing: Property.Checkbox({
            displayName: 'Disable Parsing',
            description: 'If true, the Coda API will not attempt to parse the data in any way.',
            required: false,
        })
    },
    async run(context) {
        const { docId, tableIdOrName, rowData, keyColumns, disableParsing } = context.propsValue;
        const client = codaClient(context.auth as string);

        const cells = Object.entries(rowData as Record<string, any>).map(([column, value]) => ({
            column: column,
            value: value,
        }));

        const payload = {
            rows: [
                {
                    cells: cells
                }
            ],
            keyColumns: keyColumns as string[]
        };

        return await client.mutateRows(docId as string, tableIdOrName as string, payload, {
            disableParsing: disableParsing
        });
    }
});
