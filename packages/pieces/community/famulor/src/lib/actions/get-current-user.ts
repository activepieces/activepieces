import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const getCurrentUser = createAction({
  auth: famulorAuth,
  name: 'getCurrentUser',
  displayName: 'Get User Information',
  description: 'Retrieve the authenticated user\'s profile and account balance.',
  props: famulorCommon.getCurrentUserProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.getCurrentUserSchema);

    return await famulorCommon.getCurrentUser({
      auth: auth.secret_text,
    });
  },
});
