import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bushbulletAuth } from '../../common/auth';
import { pushbulletApi } from '../../common/client';
import { pushbulletOutputSchemas } from '../../common/output-schemas';

export const aiGetCurrentUser = createAction({
  auth: bushbulletAuth,
  name: 'ai_get_current_user',
  displayName: 'Get Current User',
  description: 'Gets the connected Pushbullet user.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: pushbulletOutputSchemas.currentUser,
  aiMetadata: {
    description:
      'Returns the profile of the connected Pushbullet account: iden, email, name and max upload size. Use it to learn whose account is connected, e.g. to tell pushes sent by the owner (sender_email equals this email) from incoming ones.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    return await pushbulletApi.request<Record<string, unknown>>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/users/me',
    });
  },
});
