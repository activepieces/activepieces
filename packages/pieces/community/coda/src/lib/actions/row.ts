import { Property, createAction, DynamicPropsValue } from "@activepieces/pieces-framework";
import { codaAuth } from "../..";
import { codaClient } from "../common/common";

export const getTableRow = createAction({
    auth: codaAuth,
    name: 'get_table_row',
    displayName: 'Get Row',
    description: 'Fetch all values in a specific row from a Coda table.',
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
            description: 'The table containing the row.',
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
            description: 'The ID or name of the row (names are not recommended). If using a name, ensure it is URI encoded if it contains special characters.',
            required: true,
        }),
        useColumnNames: Property.Checkbox({
            displayName: 'Use Column Names in Output',
            description: 'Output column data using names instead of IDs (discouraged as names can change).',
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
    },
    async run(context) {
        const { docId, tableIdOrName, rowIdOrName, useColumnNames, valueFormat } = context.propsValue;
        const client = codaClient(context.auth as string);

        return await client.getRow(docId as string, tableIdOrName as string, rowIdOrName, {
            useColumnNames: useColumnNames,
            valueFormat: valueFormat as string | undefined
        });
    }
});
