import { createAction, Property } from '@activepieces/pieces-framework';

import { airtableCommon } from '../common';
import { airtableAuth } from '../../index';

export const airtableUpdateRecordAction = createAction({
  auth: airtableAuth,
  name: 'airtable_update_record',
  displayName: 'Update Airtable Record',
  description: 'Update a record in airtable',
  props: {
    base: airtableCommon.base,
    tableId: airtableCommon.tableId,
    recordId: airtableCommon.recordId,
    fields: airtableCommon.fields,
  },
  async run(context) {
    const personalToken = context.auth;
    const { base: baseId, tableId, recordId, fields } = context.propsValue;

    return await airtableCommon.updateRecord({
      personalToken,
      baseId: baseId as string,
      tableId: tableId as string,
      recordId: recordId as string,
      fields: fields as Record<string, unknown>,
    });
  },
});
