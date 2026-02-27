import { createAction, Property } from '@activepieces/pieces-framework';
import { validatedMailsAuth } from '../common/auth';
import { executeValidateEmailRequest } from '../common/validate-email-helpers';

export const validateEmail = createAction({
  auth: validatedMailsAuth,
  name: 'validateEmail',
  displayName: 'Validate Email',
  description: 'Validate a single email address using the ValidatedMails API.',
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address to validate.',
      required: true,
    }),
    dnsTimeoutMs: Property.Number({
      displayName: 'DNS Timeout (ms)',
      description: 'DNS timeout in milliseconds. Value is clamped between 200 and 5000.',
      required: false,
      defaultValue: 1500,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      description: 'HTTP method used for validation request.',
      required: true,
      defaultValue: 'POST',
      options: {
        options: [
          { label: 'POST', value: 'POST' },
          { label: 'GET', value: 'GET' },
        ],
      },
    }),
  },
  async run(context) {
    return executeValidateEmailRequest({
      ...context.propsValue,
      mode: context.propsValue.mode as 'POST' | 'GET',
    }, context.auth.secret_text);
  },
});
