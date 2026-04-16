import { createAction, Property } from '@activepieces/pieces-framework'
import { isNil } from '@activepieces/shared'
import { codaAuth } from '../auth'
import { docIdDropdown, tableIdDropdown, tableRowsDynamicProps } from '../common/props'
import { codaClient } from '../common/types'

export const updateRowAction = createAction({
    auth: codaAuth,
    name: 'update-row',
    displayName: 'Update Row',
    description: 'Updates an existing row in the selected table.',
    props: {
        docId: docIdDropdown,
        tableId: tableIdDropdown,
        rowIdOrName: Property.ShortText({
            displayName: 'Row ID or Name',
            required: true,
        }),
        rowData: tableRowsDynamicProps,
    },
    async run(context) {
        const { docId, tableId, rowIdOrName, rowData } = context.propsValue
        const client = codaClient(context.auth)

        const cells = Object.entries(rowData as Record<string, any>)
            .filter(([, value]) => value !== undefined && value !== null && value !== '')
            .map(([columnId, value]) => ({
                column: columnId,
                value: value,
            }))

        const payload = {
            row: {
                cells: cells,
            },
        }

        const response = await client.updateRow(docId, tableId, rowIdOrName, payload, {
            disableParsing: false,
        })

        const rowId = response.id

        if (isNil(rowId)) {
            throw new Error(`Unexpected error occured : ${JSON.stringify(response)}`)
        }

        return { rowId }
    },
})
