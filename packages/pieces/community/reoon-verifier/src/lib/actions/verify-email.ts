import { reoonEmailVerifyAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { VerifyEmailMode, verifySingleEmail } from '../common/send-util';
import { verifyEmailActionOutputSchema } from '../output-schemas';

export const verifyEmail = createAction({
  auth: reoonEmailVerifyAuth,
  name: 'verifyEmail',
  classification: 'READ',
  displayName: 'Verify Email',
  description: 'Check whether a single email address is valid and deliverable.',
  audience: 'human',
  aiMetadata: { description: 'Validates one email address against the Reoon email verification API, returning deliverability and risk signals (e.g. invalid, disposable, role-based). Choose between a fast Quick mode and a slower, more accurate Power mode. Use for checking a single address before sending; for many addresses use the bulk action instead. Idempotent: a read-only lookup that returns the same result for the same input.', idempotent: true },
  outputSchema: verifyEmailActionOutputSchema,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The address to check.',
      placeholder: 'name@example.com',
      required: true,
    }),
    mode: Property.StaticDropdown<VerifyEmailMode, true>({
      displayName: 'Mode',
      defaultValue: 'power',
      display: 'cards',
      description:
        'Power also checks that the inbox exists. Quick skips that check.',
      options: {
        placeholder: 'Select a mode',
        options: [
          {
            label: 'Quick',
            value: 'quick',
            description: 'Fast basic checks',
          },
          {
            label: 'Power',
            value: 'power',
            description: 'Slower, most accurate',
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
