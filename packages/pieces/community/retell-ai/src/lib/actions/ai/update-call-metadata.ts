import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const updateCallMetadataAction = createAction({
  auth: retellAiAuth,
  name: 'update_call_metadata',
  classification: 'WRITE',
  displayName: 'Update Call Metadata',
  description: 'Replaces the metadata or data storage setting of a call.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sets the metadata object and/or the data storage setting of one existing call (for example to tag it with a CRM ID). Metadata is replaced as a whole. Safe to retry with the same values.',
    idempotent: true,
  },
  props: {
    call_id: retellAiProps.id({ displayName: 'Call ID', description: 'The call to update.' }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description: 'JSON object that replaces the call metadata.',
      required: false,
    }),
    data_storage_setting: Property.StaticDropdown({
      displayName: 'Data Storage Setting',
      description: 'Optional. basic_attributes_only drops transcript and recording.',
      required: false,
      options: {
        options: [
          { label: 'Everything', value: 'everything' },
          { label: 'Everything Except PII', value: 'everything_except_pii' },
          { label: 'Basic Attributes Only', value: 'basic_attributes_only' },
        ],
      },
    }),
  },
  outputSchema: retellSchemas.call,
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {};
    const metadata = retellInput.objectValue({ value: propsValue.metadata, label: 'Metadata' });
    if (metadata !== undefined) {
      body['metadata'] = metadata;
    }
    const storage = retellInput.optionalText(propsValue.data_storage_setting);
    if (storage !== undefined) {
      body['data_storage_setting'] = storage;
    }
    if (Object.keys(body).length === 0) {
      throw new Error('Set Metadata or Data Storage Setting.');
    }
    const call = await retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.PATCH,
      path: `/v2/update-call/${retellInput.seg({ value: propsValue.call_id, label: 'Call ID' })}`,
      body,
      retryRateLimit: true,
    });
    return retellMap.call(call);
  },
});
