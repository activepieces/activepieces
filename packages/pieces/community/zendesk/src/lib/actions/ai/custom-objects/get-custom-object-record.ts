import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskGetCustomObjectRecordOutputSchema } from '../../../output-schemas';

export const zendeskGetCustomObjectRecord = createAction({
  auth: zendeskAuth,
  name: 'zendesk_get_custom_object_record',
  outputSchema: zendeskGetCustomObjectRecordOutputSchema,
  displayName: 'Get Custom Object Record',
  description: 'Get a custom object record by its ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches one custom object record with its name, external ID and field values.',
    idempotent: true,
  },
  props: {
    custom_object_key: zendeskAiProps.requiredId({ displayName: 'Custom Object Key', description: 'The object key, from List Custom Objects.' }),
    record_id: zendeskAiProps.requiredId({ displayName: 'Record ID', description: 'Record ID, from List or Search Custom Object Records.' }),
  },
  async run({ auth, propsValue }) {
    const customObjectKey = zendeskApi.pathSegment({ value: propsValue.custom_object_key, label: 'Custom Object Key' });
    const recordId = zendeskApi.pathSegment({ value: propsValue.record_id, label: 'Record ID' });
    const response = await zendeskApi.request<{ custom_object_record: Record<string, unknown> }>({
      auth,
      method: HttpMethod.GET,
      path: `/custom_objects/${customObjectKey}/records/${recordId}.json`,
    });
    return response.custom_object_record;
  },
});
