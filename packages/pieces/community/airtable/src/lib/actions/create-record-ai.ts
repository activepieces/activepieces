import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableAuth } from '../auth';
import { airtableCommon } from '../common';

export const airtableCreateRecordAiAction = createAction({
  auth: airtableAuth,
  name: 'create_record_ai',
  displayName: 'Create Record (Agent)',
  description: 'Adds a record to an Airtable table.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a single new record in an Airtable table from a JSON map of field-name to value. Call Get Base Schema (Agent) first to learn the exact field names and types; linked-record and multi-select fields take arrays of ids/strings. Each call creates a new record, so it is not idempotent (retries duplicate).',
    idempotent: false,
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
    fields: Property.Json({
      displayName: 'Fields',
      description:
        'A JSON object mapping field names to values, e.g. {"Name": "Acme", "Status": "Active"}. Use Get Base Schema (Agent) to learn field names; values are sent with typecast enabled so plain strings are coerced where possible.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { base_id, table_id_or_name, fields } = propsValue;

    return await airtableCommon.createRecord({
      personalToken: auth.secret_text,
      baseId: base_id,
      tableId: table_id_or_name,
      fields: fields as Record<string, unknown>,
    });
  },
});
