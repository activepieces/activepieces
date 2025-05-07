import { Property, createAction } from "@activepieces/pieces-framework";
import { codaAuth } from "../..";
import { codaClient } from "../common/common";

export const getTableRow = createAction({
    auth: codaAuth,
    name: 'get_table_row',
    displayName: 'Get Row',
    description: 'Fetch all values in a specific row from a Coda table.',
    props: {
        docId: Property.ShortText({
            displayName: 'Document ID',
            description: 'The ID of the Coda document.',
            required: true,
        }),
        tableIdOrName: Property.ShortText({
            displayName: 'Table ID or Name',
            description: 'The ID or name of the table (names are not recommended). If using a name, ensure it is URI encoded if it contains special characters.',
            required: true,
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
        const client = codaClient(context.auth);

        return await client.getRow(docId, tableIdOrName, rowIdOrName, {
            useColumnNames: useColumnNames,
            valueFormat: valueFormat as string | undefined
        });
    }
});
