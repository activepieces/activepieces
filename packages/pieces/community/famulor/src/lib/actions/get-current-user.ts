import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const getCurrentUser = createAction({
  auth: famulorAuth,
  name: 'getCurrentUser',
  displayName: 'Get User Information',
  description:
    'Returns the authenticated user profile (name, email) and total account balance. Use it to verify the API key, check credits, or show the current user in your UI.',
  props: famulorCommon.getCurrentUserProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.getCurrentUserSchema);

    return await famulorCommon.getCurrentUser({
      auth: auth.secret_text,
    });
  },
});
