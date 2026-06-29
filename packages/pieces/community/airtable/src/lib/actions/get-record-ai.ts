import { createAction, Property } from '@activepieces/pieces-framework';
import { airtableAuth } from '../auth';
import { airtableCommon } from '../common';

export const airtableGetRecordAiAction = createAction({
  auth: airtableAuth,
  name: 'get_record',
  displayName: 'Get Record (Agent)',
  description: 'Retrieve a single Airtable record by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Retrieves a single record and its field values by record ID. Use when you already know the exact record ID; to find records by a field value instead use Search Records (Agent) or List Records (Agent). Read-only and idempotent.',
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
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { base_id, table_id_or_name, record_id } = propsValue;

    return await airtableCommon.getRecordById({
      personalToken: auth.secret_text,
      baseId: base_id,
      tableId: table_id_or_name,
      recordId: record_id,
    });
  },
});
