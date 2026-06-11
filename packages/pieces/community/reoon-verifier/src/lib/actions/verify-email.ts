import { reoonEmailVerifyAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { VerifyEmailMode, verifySingleEmail } from '../common/send-util';

export const verifyEmail = createAction({
  auth: reoonEmailVerifyAuth,
  name: 'verifyEmail',
  displayName: 'Verify Email',
  description: 'Verify a single email',
  audience: 'both',
  aiMetadata: { description: 'Validates one email address against the Reoon email verification API, returning deliverability and risk signals (e.g. invalid, disposable, role-based). Choose between a fast Quick mode and a slower, more accurate Power mode. Use for checking a single address before sending; for many addresses use the bulk action instead. Idempotent: a read-only lookup that returns the same result for the same input.', idempotent: true },
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
