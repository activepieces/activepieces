import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callPlivoApi, plivoCommon } from '../common';
import { plivoAuth } from '../..';

export const plivoMakeCall = createAction({
  auth: plivoAuth,
  name: 'make_call',
  description: 'Place an outbound call that fetches call flow from an Answer URL.',
  audience: 'both',
  aiMetadata: { description: 'Places an outbound voice call from a Plivo number and fetches the call flow from an Answer URL that returns Plivo XML. Use to trigger a phone call whose behaviour is defined by XML you host. Requires both numbers in E.164 format and an answer URL; each call places a real, billable phone call, so it is not idempotent.', idempotent: false },
  displayName: 'Make Call',
  props: {
    from: plivoCommon.phone_number,
    to: Property.ShortText({
      displayName: 'To',
      description: 'The phone number to call. Must be in E.164 format (e.g., +15558675310).',
      required: true,
    }),
    answer_url: Property.ShortText({
      displayName: 'Answer URL',
      description: 'The URL Plivo requests when the call is answered. It must return valid Plivo XML describing the call flow.',
      required: true,
    }),
    answer_method: Property.StaticDropdown({
      displayName: 'Answer Method',
      description: 'The HTTP method Plivo uses to request the Answer URL.',
      required: false,
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
    const { from, to, answer_url, answer_method } = context.propsValue;
    const auth_id = context.auth.username;
    const auth_token = context.auth.password;
    const response = await callPlivoApi(
      HttpMethod.POST,
      'Call/',
      { auth_id, auth_token },
      {
        from,
        to,
        answer_url,
        answer_method,
      }
    );
    return response.body;
  },
});
