import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskUpsertCustomObjectRecordOutputSchema } from '../../../output-schemas';

export const zendeskUpsertCustomObjectRecord = createAction({
  auth: zendeskAuth,
  name: 'zendesk_upsert_custom_object_record',
  outputSchema: zendeskUpsertCustomObjectRecordOutputSchema,
  displayName: 'Upsert Custom Object Record',
  description: 'Update the record with this external ID or name, or create one.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Upserts one custom object record: matches by External ID, or by Name when External ID is empty, updates the given field values, and creates the record when nothing matches. created is true when a new record was made. Safe to retry.',
    idempotent: true,
  },
  props: {
    custom_object_key: zendeskAiProps.requiredId({
      displayName: 'Custom Object Key',
      description: 'The object key, from List Custom Objects.',
    }),
    external_id: Property.ShortText({ displayName: 'External ID', description: 'Match key, preferred over Name.', required: false }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Match key when External ID is empty; otherwise the name to set.',
      required: false,
    }),
    custom_object_fields: Property.Json({
      displayName: 'Field Values',
      description: 'Object of field keys to values, keys from List Custom Object Fields.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { external_id, name } = propsValue;
    if (!external_id && !name) {
      throw new Error('Pass External ID or Name to match the record on.');
    }
    const key = zendeskApi.pathSegment({ value: propsValue.custom_object_key, label: 'Custom Object Key' });
    const fields = zendeskApi.jsonObject({ value: propsValue.custom_object_fields, label: 'Field Values' });
    const response = await zendeskApi.send<{ custom_object_record: Record<string, unknown> }>({
      auth,
      method: HttpMethod.PATCH,
      path: `/custom_objects/${key}/records.json`,
      queryParams: external_id ? { external_id } : { name: name ?? '' },
      body: {
        custom_object_record: zendeskApi.compact({
          name: external_id ? name : undefined,
          custom_object_fields: Object.keys(fields).length > 0 ? fields : undefined,
        }),
      },
    });
    return { created: response.status === 201, custom_object_record: response.body.custom_object_record };
  },
});
