import { createAction, DynamicPropsValue } from '@activepieces/pieces-framework'
import { airtableAuth } from '../auth'
import { airtableCommon } from '../common'

export const airtableCreateRecordAction = createAction({
    auth: airtableAuth,
    name: 'airtable_create_record',
    displayName: 'Create Airtable Record',
    description: 'Adds a record into an airtable',
    props: {
        base: airtableCommon.base,
        tableId: airtableCommon.tableId,
        fields: airtableCommon.fields,
    },
    async run(context) {
        const personalToken = context.auth
        const { base: baseId, tableId, fields } = context.propsValue
        const fieldsWithoutEmptyValues: DynamicPropsValue = {}

        Object.keys(fields).forEach((k) => {
            const value = fields[k]
            if (value === null || value === undefined || value === '') {
                return
            }
            if (Array.isArray(value) && value.length === 0) {
                return
            }
            fieldsWithoutEmptyValues[k] = value
        })
        const newFields: Record<string, unknown> = await airtableCommon.createNewFields(
            personalToken.secret_text,
            baseId,
            tableId as string,
            fieldsWithoutEmptyValues,
        )

        return airtableCommon.createRecord({
            personalToken: personalToken.secret_text,
            baseId,
            tableId: tableId as string,
            fields: newFields,
        })
    },
})
