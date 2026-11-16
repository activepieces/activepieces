import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const updateProfileFieldAction = createAction({
  auth: podioAuth,
  name: 'podio_update_profile_field',
  displayName: 'Update Profile Field',
  description: 'Sets one field of the connected user\'s profile.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces the value of one field of the connected user\'s own profile with a single value or a list of values; set exactly one of Value and Values. Field keys are those returned by Get Profile; for several fields use Update Profile.',
    idempotent: true,
  },
  props: {
    key: podioAiProps.text({ required: true, displayName: 'Field Key', description: 'The profile field key, such as "name", "title" or "phone", as returned by Get Profile.' }),
    value: podioAiProps.text({ required: false, displayName: 'Value', description: 'The new single value of the field. Set this or Values.' }),
    values: podioAiProps.idList({ required: false, displayName: 'Values', description: 'The new list of values for a multi-value field such as mail or phone. Set this or Value.' }),
  },
  async run({ auth, propsValue }) {
    const hasValue = propsValue.value !== undefined && propsValue.value !== '';
    const hasValues = propsValue.values !== undefined && propsValue.values.length > 0;
    if (hasValue === hasValues) {
      throw new Error('Set exactly one of Value and Values.');
    }
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/user/profile/${propsValue.key}`,
      body: { value: hasValue ? propsValue.value : propsValue.values },
    });
  },
});
