import { DynamicPropsValue, createAction } from "@activepieces/pieces-framework";
import { airtableCommon } from "../common";
import { airtableAuth } from "../../index";

export const airtableCreateRecordAction = createAction({
  auth: airtableAuth,
  action: {
    name: 'airtable_create_record',
    displayName: 'Create Airtable Record',
    description: 'Adds a record into an airtable',
    sampleData: {
      "id": "recoyzj6c0Zekuz4V",
      "createdTime": "2023-03-15T12:50:33.000Z",
      "fields": {
        "fieldName": "fieldValue"
      }
    },
    props: {
      base: airtableCommon.base,
      tableId: airtableCommon.tableId,
      fields: airtableCommon.fields
    },
    async run(context) {
      const personalToken = context.auth
      const { base: baseId, tableId, fields } = context.propsValue
      const fieldsWithoutEmptyStrings: DynamicPropsValue = {}

      Object.keys(fields).forEach(k => {
        if (fields[k] !== '') {
          fieldsWithoutEmptyStrings[k] = fields[k]
        }
      })

      return airtableCommon.createRecord({
        personalToken,
        baseId,
        tableId: tableId as string,
        fields: fieldsWithoutEmptyStrings,
      })
    },
  },
})
