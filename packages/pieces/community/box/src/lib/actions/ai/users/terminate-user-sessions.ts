import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxClient } from '../../../common/client';
import { boxTerminateGroupSessionsOutputSchema } from '../../../output-schemas';

export const terminateUserSessionsAction = createAction({
  auth: boxAuth,
  name: 'box_terminate_user_sessions',
  outputSchema: boxTerminateGroupSessionsOutputSchema,
  displayName: 'Terminate User Sessions',
  description: 'Signs Box users out of all their sessions.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts background jobs that sign the given users out of every Box session and returns a status message. Give user IDs, logins or both; needs admin rights. Get IDs and logins from List Users; use Terminate Group Sessions for a whole group.',
    idempotent: false,
  },
  props: {
    userIds: Property.Array({
      displayName: 'User IDs',
      description: 'Box user IDs to sign out. Get them from List Users.',
      required: false,
    }),
    userLogins: Property.Array({
      displayName: 'User Logins',
      description: 'Login emails of users to sign out.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const userIds = (propsValue.userIds ?? []).map(String);
    const userLogins = (propsValue.userLogins ?? []).map(String);
    if (userIds.length === 0 && userLogins.length === 0) {
      throw new Error('Give at least one entry in User IDs or User Logins.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/users/terminate_sessions',
      body: { user_ids: userIds, user_logins: userLogins },
    });
  },
});
