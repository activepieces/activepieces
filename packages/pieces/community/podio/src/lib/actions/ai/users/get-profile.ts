import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioClient } from '../../../common/client';
import { podioGetProfileOutputSchema } from '../../../output-schemas';

export const getProfileAction = createAction({
  auth: podioAuth,
  name: 'podio_get_profile',
  outputSchema: podioGetProfileOutputSchema,
  displayName: 'Get Profile',
  description: 'Gets the contact profile of the connected user.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the connected user\'s own contact profile: profile id, user id and every filled profile field such as name, title, mail and phone. For one field use Get Profile Field.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: '/user/profile/' });
  },
});
