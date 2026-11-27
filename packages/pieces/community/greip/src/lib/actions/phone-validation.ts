import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../auth';
import { greipClient } from '../common/client';
import { greipProps } from '../common/props';

export const phoneValidationAction = createAction({
  auth: greipAuth,
  name: 'phone_validation',
  classification: 'READ',
  displayName: 'Phone Validation',
  description: 'Validate phone numbers by checking syntax and assessing validity and operational status',
  audience: 'both',
  aiMetadata: { description: 'Validate a phone number against its country, checking syntax and reporting validity and operational status. Requires both the phone number (any common format) and the ISO 3166-1 alpha-2 country code (e.g. US, GB, FR). Use to verify a phone before contact or fraud screening. Read-only scoring call; safe to repeat.', idempotent: true },
  props: {
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The phone number to validate (e.g., +12121234567, 0012121234567, 12121234567, or 2121234567)',
      required: true,
    }),
    countryCode: Property.ShortText({
      displayName: 'Country Code',
      description: 'ISO 3166-1 alpha-2 country code (e.g., US, GB, FR)',
      required: true,
    }),
    format: greipProps.format({ required: false }),
    mode: greipProps.mode({ required: false }),
    userID: greipProps.userID({ required: false }),
    callback: greipProps.callback({ required: false }),
  },
  async run(context) {
    const { phone, countryCode, format, mode, userID, callback } = context.propsValue;

    const queryParams: Record<string, string> = {
      phone: phone,
      countryCode: countryCode,
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
      path: '/scoring/phone',
      query: queryParams,
      auth: context.auth,
    });
  },
});

