import { reoonEmailVerifyAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { VerifyEmailMode, verifySingleEmail } from '../common/send-util';

export const verifyEmailAddress = createAction({
  auth: reoonEmailVerifyAuth,
  name: 'verify_email_address',
  displayName: 'Verify Email Address',
  description: 'Verify a single email address synchronously.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Verifies a single email address synchronously via Reoon and returns deliverability and risk signals (valid / invalid / disposable / role-based, etc.). Use this for one address at a time and when you need the result immediately; for many addresses use Create Bulk Email Verification instead. Each call consumes Reoon verification credits, and Power mode (more accurate, slower) costs more than Quick mode.',
    idempotent: true,
  },
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
      context.auth.secret_text
    ).then((res) => res.body);
  },
});
