import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableAuth } from '../auth';
import { airtableCommon } from '../common';
import { deleteRecordAiActionOutputSchema } from '../output-schemas';

export const airtableDeleteRecordAiAction = createAction({
  auth: airtableAuth,
  name: 'delete_record_ai',
  displayName: 'Delete Record (Agent)',
  description: 'Delete a single Airtable record by its ID.',
  audience: 'ai',
  outputSchema: deleteRecordAiActionOutputSchema,
  aiMetadata: {
    description:
      'Permanently deletes a single record from a table by its record ID. Use to remove one row when you have its ID; to delete several at once use Delete Records Batch (Agent). Effectively idempotent: once the record is gone the end state is unchanged (a repeat call errors on the missing ID).',
    idempotent: true,
  },
  props: {
    base_id: Property.ShortText({
      displayName: 'Base ID',
      description:
        'The Airtable base ID (e.g. "appXXXXXXXXXXXXXX"). Resolve it with List Bases (Agent).',
      required: true,
    }),
    table_id_or_name: Property.ShortText({
      displayName: 'Table ID or Name',
      description:
        'The table ID (e.g. "tblXXXXXXXXXXXXXX") or its exact name. Resolve it with Get Base Schema (Agent).',
      required: true,
    }),
    record_id: Property.ShortText({
      displayName: 'Record ID',
      description:
        'The record ID (e.g. "recXXXXXXXXXXXXXX") to delete. Resolve it with Search Records (Agent) or List Records (Agent).',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { base_id, table_id_or_name, record_id } = propsValue;

    return await airtableCommon.deleteRecord({
      personalToken: auth.secret_text,
      baseId: base_id,
      tableId: table_id_or_name,
      recordId: record_id,
    });
  },
});
