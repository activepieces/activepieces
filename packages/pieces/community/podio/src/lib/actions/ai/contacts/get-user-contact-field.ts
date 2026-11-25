import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetProfileFieldOutputSchema } from '../../../output-schemas';

export const getUserContactFieldAction = createAction({
  auth: podioAuth,
  name: 'podio_get_user_contact_field',
  outputSchema: podioGetProfileFieldOutputSchema,
  displayName: 'Get User Contact Field',
  description: 'Gets the values of one profile field of a Podio user.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the values of one profile field (for example every mail address) of one Podio user. Use Get User Contact to read the whole profile. The user id comes from List Space Memberships or Get User Status.',
    idempotent: true,
  },
  props: {
    userId: podioAiProps.id({ required: true, displayName: 'User ID', description: 'The user id (not the profile id), from List Space Memberships or Get User Status.' }),
    key: podioAiProps.choice({ required: true, displayName: 'Field', description: 'The profile field to read.', values: ['name', 'avatar', 'birthdate', 'organization', 'department', 'skype', 'about', 'address', 'zip', 'city', 'state', 'country', 'location', 'mail', 'phone', 'title', 'linkedin', 'twitter', 'url', 'skill'] }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/contact/user/${propsValue.userId}/${propsValue.key}` });
    return { values: body, count: body.length };
  },
});
