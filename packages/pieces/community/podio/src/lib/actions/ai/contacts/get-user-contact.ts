import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetProfileOutputSchema } from '../../../output-schemas';

export const getUserContactAction = createAction({
  auth: podioAuth,
  name: 'podio_get_user_contact',
  outputSchema: podioGetProfileOutputSchema,
  displayName: 'Get User Contact',
  description: 'Gets the contact profile of one Podio user by user id.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the contact profile (name, mail, phone, title and the other profile fields) of one Podio user by user id, not profile id. The user id comes from List Space Memberships, Get Organization Members or Get User Status.',
    idempotent: true,
  },
  props: {
    userId: podioAiProps.id({ required: true, displayName: 'User ID', description: 'The user id (not the profile id), from List Space Memberships or Get User Status.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/contact/user/${propsValue.userId}` });
  },
});
