import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { assertKnackRecordFound, knackApiCall } from '../common/client';
import { knackAuth } from '../common/auth';
import { parseFieldsObject, splitKnackRecord } from '../common/props';
import { splitRecordOutputSchema } from '../common/schemas';

export const updateRecordAiAction = createAction({
  auth: knackAuth,
  name: 'update_record_ai',
  classification: 'WRITE',
  displayName: 'Update Record (Agent)',
  description: 'Updates fields of a Knack record from a JSON object.',
  audience: 'ai',
  outputSchema: splitRecordOutputSchema,
  aiMetadata: {
    description: 'Updates an existing Knack record by ID. Send only the fields to change as a JSON object keyed by field key (e.g. {"field_2": "Active"}); fields not sent are left unchanged. Value formats match Create Record (Agent). Knack accepts any value for a choice field without validating it, so use values from the options returned by Get Object Fields (Agent). A missing record ID returns a not-found error. Idempotent: sending the same values again yields the same record.',
    idempotent: true,
  },
  props: {
    object_key: Property.ShortText({
      displayName: 'Object Key',
      description: 'Knack object key such as object_1, from List Objects (Agent).',
      required: true,
    }),
    record_id: Property.ShortText({
      displayName: 'Record ID',
      description: 'The 24-character ID of the record to update.',
      required: true,
    }),
    fields: Property.Json({
      displayName: 'Fields',
      description: 'JSON object of the fields to change, keyed by Knack field key.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const body = parseFieldsObject(propsValue.fields);
    if (Object.keys(body).length === 0) {
      throw new Error('Fields must contain at least one field to update.');
    }
    const record = await knackApiCall<Record<string, unknown>>({
      method: HttpMethod.PUT,
      auth,
      resourceUri: `/objects/${encodeURIComponent(propsValue.object_key.trim())}/records/${encodeURIComponent(propsValue.record_id.trim())}`,
      body,
    });
    assertKnackRecordFound({
      record,
      recordId: propsValue.record_id.trim(),
      objectKey: propsValue.object_key.trim(),
    });
    return splitKnackRecord(record);
  },
});
