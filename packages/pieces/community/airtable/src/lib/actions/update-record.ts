import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';

import { airtableCommon } from '../common';
import { airtableAuth } from '../auth';
import { updateRecordActionOutputSchema } from '../output-schemas';

export const airtableUpdateRecordAction = createAction({
  auth: airtableAuth,
  name: 'airtable_update_record',
  classification: 'WRITE',
  displayName: 'Update Airtable Record',
  description: 'Update the fields you turn on in a record in airtable',
  audience: 'human',
  outputSchema: updateRecordActionOutputSchema,
  aiMetadata: {
    description:
      'Updates an existing record identified by its record ID, writing only the fields whose toggle is turned on and leaving every other field untouched (PATCH semantics). A field turned on with an empty value is cleared. Use when you already know the record ID and want to change or clear specific fields. Idempotent: repeating with the same input yields the same final state.',
    idempotent: true,
  },
  props: {
    base: airtableCommon.base,
    tableId: airtableCommon.tableId,
    recordId: airtableCommon.recordId,
    hint: Property.MarkDown({
      value:
        'Turn on the fields you want to write. A field you turn on and leave empty is cleared in Airtable.',
      variant: MarkdownVariant.INFO,
    }),
    fields: airtableCommon.updateFields,
  },
  async run(context) {
    const personalToken = context.auth;
    const { base: baseId, tableId, recordId, fields } = context.propsValue;

    const table = await airtableCommon.fetchTable({
      token: personalToken.secret_text,
      baseId: baseId as string,
      tableId: tableId as string,
    });

    const updatedFields = airtableCommon.buildUpdateFields({
      tableFields: table.fields,
      fields,
    });

    return await airtableCommon.updateRecord({
      personalToken: personalToken.secret_text,
      baseId: baseId as string,
      tableId: tableId as string,
      recordId: recordId as string,
      fields: updatedFields,
    });
  },
});
