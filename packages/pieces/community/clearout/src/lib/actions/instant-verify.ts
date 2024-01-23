import { createAction, Property } from '@activepieces/pieces-framework';
import { instantVerify } from '../api';
import { clearoutAuth } from '../auth';

export const instantVerifyAction = createAction({
  name: 'instant_verify',
  auth: clearoutAuth,
  displayName: 'Instant Verify',
  description: 'Instant Verify an email address',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address to verify',
      required: true,
    }),
  },
  async run(context) {
    return await instantVerify(context.auth, {
      email: context.propsValue.email,
    });
  },
});
