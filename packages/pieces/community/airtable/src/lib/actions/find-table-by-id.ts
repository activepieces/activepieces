import { createAction } from '@activepieces/pieces-framework';
import { airtableAuth } from '../../index';
import { airtableCommon } from '../common';

export const airtableFindTableByIdAction = createAction({
  auth: airtableAuth,
  name: 'airtable_find_table_by_id',
  displayName: 'Find Table by ID',
  description: "Get a table's details and schema using its ID.",
  props: {
    base: airtableCommon.base,
    tableId: airtableCommon.tableId,
  },
  async run(context) {
    const { auth: personalToken, propsValue } = context;
    const { base: baseId, tableId } = propsValue;
    return await airtableCommon.fetchTable({
      token: personalToken,
      baseId: baseId as string,
      tableId: tableId as string,
    });
  },
});