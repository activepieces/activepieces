import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../auth';
import { greipClient } from '../common/client';
import { greipProps } from '../common/props';

export const emailValidationAction = createAction({
  auth: greipAuth,
  name: 'email_validation',
  classification: 'READ',
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
    format: greipProps.format({ required: false }),
    mode: greipProps.mode({ required: false }),
    userID: greipProps.userID({ required: false }),
    callback: greipProps.callback({ required: false }),
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

    return await greipClient.request({
      method: HttpMethod.GET,
      path: '/scoring/email',
      query: queryParams,
      auth: context.auth,
    });
  },
});

