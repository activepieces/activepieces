import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetProfileFieldOutputSchema } from '../../../output-schemas';

export const getProfileFieldAction = createAction({
  auth: podioAuth,
  name: 'podio_get_profile_field',
  outputSchema: podioGetProfileFieldOutputSchema,
  displayName: 'Get Profile Field',
  description: 'Gets the values of one field of the connected user\'s profile.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the values of one field of the connected user\'s own profile, such as mail or phone. The keys are the profile field names returned by Get Profile.',
    idempotent: true,
  },
  props: {
    key: podioAiProps.text({ required: true, displayName: 'Field Key', description: 'The profile field key, such as "name", "mail" or "phone", as returned by Get Profile.' }),
  },
  async run({ auth, propsValue }) {
    const values = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/user/profile/${propsValue.key}` });
    return { values, count: values.length };
  },
});
