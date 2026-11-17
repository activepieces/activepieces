import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { assertKnackRecordFound, knackApiCall } from '../common/client';
import { knackAuth } from '../common/auth';
import { splitKnackRecord } from '../common/props';
import { splitRecordOutputSchema } from '../common/schemas';

export const getRecordAction = createAction({
  auth: knackAuth,
  name: 'get_record',
  classification: 'READ',
  displayName: 'Get Record (Agent)',
  description: 'Gets one Knack record by its ID.',
  audience: 'ai',
  outputSchema: splitRecordOutputSchema,
  aiMetadata: {
    description: 'Fetches one record from a Knack object by its record ID. Returns the ID and the field values keyed by field key: "field_N" is the formatted value and "field_N_raw" the structured value. Use Get Object Fields (Agent) to translate keys to names. A missing ID returns a not-found error. Read-only and idempotent.',
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
      description: 'The 24-character record ID, e.g. from Search Records (Agent).',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const record = await knackApiCall<Record<string, unknown>>({
      method: HttpMethod.GET,
      auth,
      resourceUri: `/objects/${encodeURIComponent(propsValue.object_key.trim())}/records/${encodeURIComponent(propsValue.record_id.trim())}`,
    });
    assertKnackRecordFound({
      record,
      recordId: propsValue.record_id.trim(),
      objectKey: propsValue.object_key.trim(),
    });
    return splitKnackRecord(record);
  },
});
