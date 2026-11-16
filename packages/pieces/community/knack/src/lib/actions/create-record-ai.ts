import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { knackApiCall } from '../common/client';
import { knackAuth } from '../common/auth';
import { parseFieldsObject, splitKnackRecord } from '../common/props';
import { splitRecordOutputSchema } from '../common/schemas';

export const createRecordAiAction = createAction({
  auth: knackAuth,
  name: 'create_record_ai',
  classification: 'WRITE',
  displayName: 'Create Record (Agent)',
  description: 'Creates a Knack record from a JSON object of field values.',
  audience: 'ai',
  outputSchema: splitRecordOutputSchema,
  aiMetadata: {
    description: 'Creates a new record in a Knack object. Pass field values as a JSON object keyed by field key (e.g. {"field_1": "Jane", "field_3": 42}); get keys and allowed options from Get Object Fields (Agent). Multiple-choice takes the option text, yes/no takes true/false, connection fields take an array of record IDs, name fields take {"first","last"}, email fields take {"email"}. Knack accepts any value for a choice field without validating it, so use values from the options returned by Get Object Fields (Agent). Returns the new record ID and stored values. Not idempotent: each call inserts another record.',
    idempotent: false,
  },
  props: {
    object_key: Property.ShortText({
      displayName: 'Object Key',
      description: 'Knack object key such as object_1, from List Objects (Agent).',
      required: true,
    }),
    fields: Property.Json({
      displayName: 'Fields',
      description: 'JSON object keyed by Knack field key, e.g. {"field_1": "Jane"}.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const body = parseFieldsObject(propsValue.fields);
    const record = await knackApiCall<Record<string, unknown>>({
      method: HttpMethod.POST,
      auth,
      resourceUri: `/objects/${encodeURIComponent(propsValue.object_key.trim())}/records`,
      body,
    });
    return splitKnackRecord(record);
  },
});
