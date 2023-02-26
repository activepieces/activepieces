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
    table: airtableCommon.table,
    fields: airtableCommon.fields
  },
  async run(context) {
  }
});