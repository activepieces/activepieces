import { createAction } from "@activepieces/framework";
import { airtableCommon } from "../common";

export const airtableCreateRecord = createAction({
  name: 'airtable_create_record',
  displayName: 'Create Airtable Record',
  description: 'Adds a record into an airtable',
  sampleData: {
    "status": 1
  },
  props: {
    authentication: airtableCommon.authentication,
    base: airtableCommon.base,
    tableId: airtableCommon.table,
    fields: airtableCommon.fields
  },
  async run(context) {
    const {authentication: personalToken, base: baseId, tableId, fields} = context.propsValue

    return airtableCommon.createRecord({
      personalToken,
      baseId,
      tableId: tableId as string,
      fields
    })
  }
})