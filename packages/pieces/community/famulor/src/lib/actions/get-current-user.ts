import { createAction } from '@activepieces/pieces-framework';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const getCurrentUser = createAction({
  auth: famulorAuth,
  name: 'getCurrentUser',
  displayName: 'Get Current User',
  description: 'Get the authenticated user\'s profile information, including their account balance.',
  props: {},
  async run({ auth }) {
    return await famulorCommon.getCurrentUser({
      auth: auth as string,
    });
  },
});
