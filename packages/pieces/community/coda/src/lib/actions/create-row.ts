import { Property, createAction } from "@activepieces/pieces-framework";
import { codaAuth } from "../..";
import { codaClient } from "../common/common";

export const createRow = createAction({
    auth: codaAuth,
    name: 'create_row',
    displayName: 'Create Row',
    description: 'Insert a new row into a Coda table.',
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
            description: 'Object mapping Column IDs or Names to their values for the new row. E.g., `{"Column Name 1": "Value A", "c-123xyz": 42}`',
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
        const { docId, tableIdOrName, rowData, disableParsing } = context.propsValue;
        const client = codaClient(context.auth);

        // Transform the user-provided rowData (Record<string, any>) into CodaRowEdit structure
        const cells = Object.entries(rowData as Record<string, any>).map(([column, value]) => ({
            column: column,
            value: value,
        }));

        const payload = {
            rows: [
                {
                    cells: cells
                }
            ]
        };

        return await client.mutateRows(docId, tableIdOrName, payload, {
            disableParsing: disableParsing
        });
    }
});
