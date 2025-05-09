import { Property, createAction } from "@activepieces/pieces-framework";
import { codaAuth } from "../..";
import { codaClient } from "../common/common";

export const updateRow = createAction({
    auth: codaAuth,
    name: 'update_row',
    displayName: 'Update Row',
    description: 'Update a specific row in a Coda table by its ID or name.',
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
        const client = codaClient(context.auth);

        const cells = Object.entries(rowData as Record<string, any>).map(([column, value]) => ({
            column: column,
            value: value,
        }));

        const payload = {
            row: {
                cells: cells
            }
        };

        return await client.updateRow(docId, tableIdOrName, rowIdOrName, payload, {
            disableParsing: disableParsing
        });
    }
});
