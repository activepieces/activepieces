import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../common/auth';
import { greipApiCall } from '../common/client';

export const emailValidation = createAction({
  auth: greipAuth,
  name: 'email_validation',
  displayName: 'Email Validation',
  description: 'Validate email addresses by checking domain validity, detecting disposable emails, and assessing risk factors',
  audience: 'both',
  aiMetadata: { description: 'Validate and risk-score a single email address, checking domain/MX validity, disposable-email detection, and fraud indicators. Use to verify an email before signup, contact, or fraud screening. Read-only scoring call; safe to repeat.', idempotent: true },
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address to validate',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Response Format',
      description: 'Format of the response',
      required: false,
      defaultValue: 'JSON',
      options: {
        options: [
          { label: 'JSON', value: 'JSON' },
          { label: 'XML', value: 'XML' },
          { label: 'CSV', value: 'CSV' },
          { label: 'Newline', value: 'Newline' },
        ],
      },
    }),
    mode: Property.StaticDropdown({
      displayName: 'Environment',
      description: 'Environment mode for testing or production',
      required: false,
      defaultValue: 'live',
      options: {
        options: [
          { label: 'Live', value: 'live' },
          { label: 'Test', value: 'test' },
        ],
      },
    }),
    userID: Property.ShortText({
      displayName: 'User Identifier',
      description: 'Identify requests from specific users for monitoring (e.g., email, phone, user ID)',
      required: false,
    }),
    callback: Property.ShortText({
      displayName: 'JSONP Callback',
      description: 'Function name for JSONP response format',
      required: false,
    }),
  },
  async run(context) {
    const { email, format, mode, userID, callback } = context.propsValue;

    const queryParams: Record<string, string> = {
      email: email,
    };

    if (format) {
      queryParams['format'] = format;
    }

    if (mode) {
      queryParams['mode'] = mode;
    }

    if (userID) {
      queryParams['userID'] = userID;
    }

    if (callback) {
      queryParams['callback'] = callback;
    }

    return await greipApiCall({
      method: HttpMethod.GET,
      path: '/scoring/email',
      queryParams,
      auth: context.auth,
    });
  },
});

