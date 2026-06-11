import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const getCurrentUser = createAction({
  auth: famulorAuth,
  name: 'getCurrentUser',
  displayName: 'Get User Information',
  description: 'Retrieve the authenticated user\'s profile and account balance.',
  audience: 'both',
  aiMetadata: {
    description:
      'Get the authenticated user\'s profile and current account balance for the supplied API credentials. Use to verify the connection or check available balance before placing calls or sending messages. Read-only and idempotent.',
    idempotent: true,
  },
  props: famulorCommon.getCurrentUserProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.getCurrentUserSchema);

    return await famulorCommon.getCurrentUser({
      auth: auth.secret_text,
    });
  },
});
