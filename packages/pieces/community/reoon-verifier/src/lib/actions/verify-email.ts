import { reoonEmailVerifyAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { VerifyEmailMode, verifySingleEmail } from '../common/send-util';

export const verifyEmail = createAction({
  auth: reoonEmailVerifyAuth,
  name: 'verifyEmail',
  displayName: 'Verify Email',
  description: 'Verify a single email',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email to verify',
      required: true,
    }),
    mode: Property.StaticDropdown<VerifyEmailMode, true>({
      displayName: 'Mode',
      defaultValue: 'power',
      description:
        'Verification mode (Power mode is more accurate but a bit slower)',
      options: {
        placeholder: 'Select a mode',
        options: [
          {
            label: 'Quick',
            value: 'quick',
          },
          {
            label: 'Power',
            value: 'power',
          },
        ],
      },
      required: true,
    }),
  },
  async run(context) {
    return verifySingleEmail(
      context.propsValue.email,
      context.propsValue.mode,
      context.auth
    ).then((res) => res.body);
  },
});
