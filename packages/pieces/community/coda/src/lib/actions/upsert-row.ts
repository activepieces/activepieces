import { Property, createAction } from "@activepieces/pieces-framework";
import { codaAuth } from "../..";
import { codaClient } from "../common/common";

export const upsertRow = createAction({
    auth: codaAuth,
    name: 'upsert_row',
    displayName: 'Upsert Row',
    description: 'Insert a new row or update an existing one if it matches key columns.',
    props: {
        docId: Property.ShortText({
            displayName: 'Document ID',
            description: 'The ID of the Coda document.',
            required: true,
        }),
        tableIdOrName: Property.ShortText({
            displayName: 'Table ID or Name',
            description: 'The ID or name of the table. If using a name, ensure it is URI encoded. This action only works for base tables, not views.',
            required: true,
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
        const client = codaClient(context.auth);

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

        return await client.mutateRows(docId, tableIdOrName, payload, {
            disableParsing: disableParsing
        });
    }
});
