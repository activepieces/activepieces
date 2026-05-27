import {
  createAction,
} from '@activepieces/pieces-framework';

import { airtableCommon } from '../common';
import { airtableAuth } from '../auth';

export const airtableCleanRecordAction = createAction({
  auth: airtableAuth,
  name: 'airtable_clean_record',
  displayName: 'Clean Record',
  description:
    'Clears fields in a record. Empty values will clear the corresponding fields.',
  props: {
    base: airtableCommon.base,
    tableId: airtableCommon.tableId,
    recordId: airtableCommon.recordId,
    fields: airtableCommon.fields,
  },
  async run(context) {
    const personalToken = context.auth;
    const { base: baseId, tableId, recordId, fields } = context.propsValue;

    const updatedFields: Record<string, unknown> =
      await airtableCommon.createNewFields(
        personalToken.secret_text,
        baseId,
        tableId as string,
        fields,
        true
      );

    return await airtableCommon.updateRecord({
      personalToken: personalToken.secret_text,
      baseId: baseId as string,
      tableId: tableId as string,
      recordId: recordId as string,
      fields: updatedFields as Record<string, unknown>,
    });
  },
});
