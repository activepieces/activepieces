import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskGetCustomObjectRecordOutputSchema } from '../../../output-schemas';

export const zendeskUpdateCustomObjectRecord = createAction({
  auth: zendeskAuth,
  name: 'zendesk_update_custom_object_record',
  outputSchema: zendeskGetCustomObjectRecordOutputSchema,
  displayName: 'Update Custom Object Record',
  description: 'Change fields on a custom object record.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates one custom object record by ID; only the given fields change. Set a field to null in Field Values to clear it. Record IDs come from List or Search Custom Object Records.',
    idempotent: true,
  },
  props: {
    custom_object_key: zendeskAiProps.requiredId({
      displayName: 'Custom Object Key',
      description: 'The object key, from List Custom Objects.',
    }),
    record_id: zendeskAiProps.requiredId({
      displayName: 'Record ID',
      description: 'Record ID, from List or Search Custom Object Records.',
    }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    external_id: Property.ShortText({ displayName: 'External ID', required: false }),
    custom_object_fields: Property.Json({
      displayName: 'Field Values',
      description: 'Object of field keys to values, keys from List Custom Object Fields.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const key = zendeskApi.pathSegment({ value: propsValue.custom_object_key, label: 'Custom Object Key' });
    const recordId = zendeskApi.pathSegment({ value: propsValue.record_id, label: 'Record ID' });
    const fields = zendeskApi.jsonObject({ value: propsValue.custom_object_fields, label: 'Field Values' });
    const record = zendeskApi.compact({
      name: propsValue.name,
      external_id: propsValue.external_id,
      custom_object_fields: Object.keys(fields).length > 0 ? fields : undefined,
    });
    if (Object.keys(record).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    const response = await zendeskApi.request<{ custom_object_record: Record<string, unknown> }>({
      auth,
      method: HttpMethod.PATCH,
      path: `/custom_objects/${key}/records/${recordId}.json`,
      body: { custom_object_record: record },
    });
    return response.custom_object_record;
  },
});
