import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioApi } from '../../../common/api';
import { podioGetUserStatusOutputSchema } from '../../../output-schemas';

export const getUserStatusAction = createAction({
  auth: podioAuth,
  name: 'podio_get_user_status',
  outputSchema: podioGetUserStatusOutputSchema,
  displayName: 'Get User Status',
  description: 'Gets the connected user with their profile, properties and unread counts.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads who the connected user is in one call: account (user id, email), contact profile (profile id), stored properties, flags and the number of unread notifications and messages. Use it to find the connected user\'s own user and profile ids.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await podioApi.getUserStatus({ auth });
  },
});
