import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableAuth } from '../auth';
import { airtableCommon } from '../common';

export const airtableUpdateRecordAiAction = createAction({
  auth: airtableAuth,
  name: 'update_record_ai',
  displayName: 'Update Record (Agent)',
  description: 'Update fields on an existing Airtable record by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates an existing record by its ID, writing only the supplied fields and leaving the rest untouched (PATCH semantics). Use when you know the record ID and want to change specific fields; to set a field empty pass null. Idempotent: repeating with the same input yields the same final state.',
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
        'The record ID (e.g. "recXXXXXXXXXXXXXX"). Resolve it with Search Records (Agent) or List Records (Agent).',
      required: true,
    }),
    fields: Property.Json({
      displayName: 'Fields',
      description:
        'A JSON object mapping field names to new values, e.g. {"Status": "Done"}. Only the keys you supply are changed; linked-record and multi-select fields take arrays. Use Get Base Schema (Agent) to learn field names.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { base_id, table_id_or_name, record_id, fields } = propsValue;

    return await airtableCommon.updateRecord({
      personalToken: auth.secret_text,
      baseId: base_id,
      tableId: table_id_or_name,
      recordId: record_id,
      fields: fields as Record<string, unknown>,
    });
  },
});
