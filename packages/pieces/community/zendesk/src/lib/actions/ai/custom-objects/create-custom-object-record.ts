import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskGetCustomObjectRecordOutputSchema } from '../../../output-schemas';

export const zendeskCreateCustomObjectRecord = createAction({
  auth: zendeskAuth,
  name: 'zendesk_create_custom_object_record',
  outputSchema: zendeskGetCustomObjectRecordOutputSchema,
  displayName: 'Create Custom Object Record',
  description: 'Create a record of a custom object.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates one record of a custom object with a name and field values keyed by the field keys from List Custom Object Fields. Not idempotent; use Upsert Custom Object Record with an external ID to avoid duplicates.',
    idempotent: false,
  },
  props: {
    custom_object_key: zendeskAiProps.requiredId({
      displayName: 'Custom Object Key',
      description: 'The object key, from List Custom Objects.',
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Record name. Required unless the object autonumbers names.',
      required: false,
    }),
    external_id: Property.ShortText({ displayName: 'External ID', description: 'Your own unique reference.', required: false }),
    custom_object_fields: Property.Json({
      displayName: 'Field Values',
      description: 'Object of field keys to values, keys from List Custom Object Fields.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const key = zendeskApi.pathSegment({ value: propsValue.custom_object_key, label: 'Custom Object Key' });
    const fields = zendeskApi.jsonObject({ value: propsValue.custom_object_fields, label: 'Field Values' });
    const response = await zendeskApi.request<{ custom_object_record: Record<string, unknown> }>({
      auth,
      method: HttpMethod.POST,
      path: `/custom_objects/${key}/records.json`,
      body: {
        custom_object_record: zendeskApi.compact({
          name: propsValue.name,
          external_id: propsValue.external_id,
          custom_object_fields: Object.keys(fields).length > 0 ? fields : undefined,
        }),
      },
    });
    return response.custom_object_record;
  },
});
