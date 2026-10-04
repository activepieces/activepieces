import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskDeleteCustomObjectRecordOutputSchema } from '../../../output-schemas';

export const zendeskDeleteCustomObjectRecord = createAction({
  auth: zendeskAuth,
  name: 'zendesk_delete_custom_object_record',
  outputSchema: zendeskDeleteCustomObjectRecordOutputSchema,
  displayName: 'Delete Custom Object Record',
  description: 'Delete a custom object record.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes one custom object record. Cannot be undone.',
    idempotent: false,
  },
  props: {
    custom_object_key: zendeskAiProps.requiredId({ displayName: 'Custom Object Key', description: 'The object key, from List Custom Objects.' }),
    record_id: zendeskAiProps.requiredId({ displayName: 'Record ID', description: 'Record ID, from List or Search Custom Object Records.' }),
  },
  async run({ auth, propsValue }) {
    const customObjectKey = zendeskApi.pathSegment({ value: propsValue.custom_object_key, label: 'Custom Object Key' });
    const recordId = zendeskApi.pathSegment({ value: propsValue.record_id, label: 'Record ID' });
    await zendeskApi.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/custom_objects/${customObjectKey}/records/${recordId}.json`,
    });
    return { success: true, custom_object_key: propsValue.custom_object_key, record_id: propsValue.record_id };
  },
});
