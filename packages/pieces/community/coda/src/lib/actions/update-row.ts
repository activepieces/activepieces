import { Property, createAction, DynamicPropsValue } from "@activepieces/pieces-framework";
import { codaAuth } from "../..";
import { codaClient } from "../common/common";

export const updateRow = createAction({
    auth: codaAuth,
    name: 'update_row',
    displayName: 'Update Row',
    description: 'Update a specific row in a Coda table by its ID or name.',
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
            description: 'The table containing the row to update.',
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
        rowIdOrName: Property.ShortText({
            displayName: 'Row ID or Name',
            description: 'The ID or name of the row to update. If using a name, ensure it is URI encoded.',
            required: true,
        }),
        rowData: Property.Json({
            displayName: 'Row Data to Update',
            description: 'Object mapping Column IDs or Names to their new values. E.g., `{"Column Name 1": "New Value A", "c-123xyz": 99}`',
            required: true,
            defaultValue: {},
        }),
        disableParsing: Property.Checkbox({
            displayName: 'Disable Parsing',
            description: 'If true, the Coda API will not attempt to parse the data in any way.',
            required: false,
        })
    },
    async run(context) {
        const { docId, tableIdOrName, rowIdOrName, rowData, disableParsing } = context.propsValue;
        const client = codaClient(context.auth as string);

        const cells = Object.entries(rowData as Record<string, any>).map(([column, value]) => ({
            column: column,
            value: value,
        }));

        const payload = {
            row: {
                cells: cells
            }
        };

        return await client.updateRow(docId as string, tableIdOrName as string, rowIdOrName, payload, {
            disableParsing: disableParsing
        });
    }
});
