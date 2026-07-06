import { createAction } from '@activepieces/pieces-framework';
import { airtableAuth } from '../auth';
import { airtableCommon } from '../common';

export const airtableFindTableByIdAction = createAction({
  auth: airtableAuth,
  name: 'airtable_find_table_by_id',
  displayName: 'Find Table by ID',
  description: "Get a table's details and schema using its ID.",
  audience: 'both',
  aiMetadata: {
    description:
      "Fetches a single table's details and field schema by its base and table ID. Use when you already have the table ID and need its structure (field names, types) before reading or writing records. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    base: airtableCommon.base,
    tableId: airtableCommon.tableId,
  },
  async run(context) {
    const { auth: personalToken, propsValue } = context;
    const { base: baseId, tableId } = propsValue;
    return await airtableCommon.fetchTable({
      token: personalToken.secret_text,
      baseId: baseId as string,
      tableId: tableId as string,
    });
  },
});