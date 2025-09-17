import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableCommon } from '../common';
import { airtableAuth } from '../../index';
import { AirtableFindTableByIdRequest } from '../common/models';

export const airtableFindTableByIdAction = createAction({
  auth: airtableAuth,
  name: 'airtable_find_table_by_id',
  displayName: 'Find Airtable Table by ID',
  description: 'Fetches a table from a base using its unique table ID ',
  props: {
    baseId: airtableCommon.base,
    tableId: airtableCommon.tableId,
  },
  async run(context) {
    const personalToken = context.auth as string;
    const { baseId, tableId } = context.propsValue;

    const req: AirtableFindTableByIdRequest = {
      personalToken,
      baseId: baseId as string,
      tableId: tableId as string,
    };

    return await airtableCommon.findTableById(req);
  },
});
