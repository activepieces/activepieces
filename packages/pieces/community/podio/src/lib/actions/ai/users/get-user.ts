import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioClient } from '../../../common/client';
import { podioGetUserOutputSchema } from '../../../output-schemas';

export const getUserAction = createAction({
  auth: podioAuth,
  name: 'podio_get_user',
  outputSchema: podioGetUserOutputSchema,
  displayName: 'Get User',
  description: 'Gets the connected user\'s account: id, login email, status, locale and timezone.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the connected user\'s account record: user id, login email, status, locale, timezone, flags and creation date. For profile, properties and unread counts in one call use Get User Status.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: '/user' });
  },
});
