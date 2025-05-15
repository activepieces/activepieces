import { Property, createAction, DynamicPropsValue, InputPropertyMap, PropertyContext } from "@activepieces/pieces-framework";
import { codaAuth } from "../..";
import { CodaTableColumn, codaClient } from "../common/common";

export const createRow = createAction({
    auth: codaAuth,
    name: 'create_row',
    displayName: 'Create Row',
    description: 'Insert a new row into a Coda table.',
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
                const client = codaClient(auth as unknown as string);
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
            description: 'The table to create the row in. This action only works for base tables, not views.',
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
                const client = codaClient(auth as unknown as string);
                let tables: { label: string, value: string }[] = [];
                let nextPageToken: string | undefined = undefined;

                try {
                    do {
                        const response = await client.listTables(docId as unknown as string, { limit: 100, pageToken: nextPageToken, tableTypes: 'table' });
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
        rowData: Property.DynamicProperties({
            displayName: 'Row Data',
            description: 'Define the data for the new row based on table columns.',
            required: true,
            refreshers: ['auth', 'docId', 'tableIdOrName'],
            props: async (propsValue: Record<string, DynamicPropsValue>) : Promise<InputPropertyMap> => {
                const auth = propsValue['auth'];
                const docId = propsValue['docId'];
                const tableId = propsValue['tableIdOrName'];

                if (!auth || !docId || !tableId) {
                    return {};
                }

                const client = codaClient(auth as unknown as string);
                const fields: InputPropertyMap = {};

                try {
                    const tableDetails = await client.getTableDetails(docId as unknown as string, tableId as unknown as string);
                    if (tableDetails.tableType === 'view') {
                        // UI should show a message or this state should be handled by a placeholder on a dummy field if possible
                        // For now, returning empty fields is the direct approach for DynamicProperties
                        console.warn('Coda: Cannot create rows in a view. Please select a base table.');
                        return {};
                    }

                    let allColumns: CodaTableColumn[] = [];
                    let nextPageToken: string | undefined = undefined;
                    do {
                        const columnsResponse = await client.listColumns(docId as unknown as string, tableId as unknown as string, {
                            limit: 100,
                            pageToken: nextPageToken
                        });
                        if(columnsResponse.items) {
                            allColumns = allColumns.concat(columnsResponse.items);
                        }
                        nextPageToken = columnsResponse.nextPageToken;
                    } while(nextPageToken);


                    if (allColumns) {
                        for (const column of allColumns) {
                            if (column.calculated) {
                                continue;
                            }

                            let fieldType: any = Property.ShortText;
                            let extraProps: Record<string, unknown> = {};

                            switch (column.format.type.toLowerCase()) {
                                case 'number':
                                case 'currency':
                                case 'percent':
                                case 'slider':
                                case 'scale':
                                    fieldType = Property.Number;
                                    break;
                                case 'date':
                                case 'datetime':
                                    fieldType = Property.DateTime;
                                    break;
                                case 'checkbox':
                                    fieldType = Property.Checkbox;
                                    extraProps = { defaultValue: false };
                                    break;
                                default:
                                    fieldType = Property.ShortText;
                                    break;
                            }

                            fields[column.id] = fieldType({
                                displayName: column.name,
                                description: `Column ID: ${column.id} (Type: ${column.format.type})`,
                                required: false,
                                ...extraProps
                            });
                        }
                    }
                    if (Object.keys(fields).length === 0) {
                        console.warn("Coda: No writable columns found or table details couldn't be loaded.");
                        return {};
                    }
                    return fields;
                } catch (error) {
                    console.error("Coda: Failed to fetch table columns for dynamic properties:", error);
                    return {};
                }
            }
        }),
        disableParsing: Property.Checkbox({
            displayName: 'Disable Parsing',
            description: 'If true, the Coda API will not attempt to parse the data in any way.',
            required: false,
        })
    },
    async run(context) {
        const { docId, tableIdOrName, rowData, disableParsing } = context.propsValue;
        const client = codaClient(context.auth as unknown as string);

        const cells = Object.entries(rowData as Record<string, any>)
            .filter(([, value]) => value !== undefined && value !== null && value !== '')
            .map(([columnId, value]) => ({
            column: columnId,
            value: value,
        }));

        if (cells.length === 0) {
            console.warn("Coda Create Row: No data provided in rowData. Attempting to create a potentially empty row.");
        }

        const payload = {
            rows: [
                {
                    cells: cells
                }
            ]
        };

        return await client.mutateRows(docId as unknown as string, tableIdOrName as unknown as string, payload, {
            disableParsing: disableParsing
        });
    }
});
