import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wavixAuth } from '../common/auth';
import { wavixApiCall } from '../common/client';

export const send2faCode = createAction({
  auth: wavixAuth,
  name: 'send_2fa_code',
  classification: 'WRITE',
  displayName: 'Send 2FA Code',
  description:
    'Start a 2FA verification: generate and send a one-time code to a phone number.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a 2FA verification and sends a one-time code over SMS or voice, returning the session_id needed to verify it. Requires a 2FA service configured in the Wavix portal.',
    idempotent: false,
  },
  props: {
    serviceId: Property.ShortText({
      displayName: '2FA Service ID',
      description:
        'ID of a 2FA service configured in the Wavix portal (API settings).',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'To',
      description: "End user's phone number in E.164 format.",
      required: true,
    }),
    channel: Property.StaticDropdown({
      displayName: 'Channel',
      description: 'How to deliver the code.',
      required: true,
      defaultValue: 'sms',
      options: {
        options: [
          { label: 'SMS', value: 'sms' },
          { label: 'Voice', value: 'voice' },
        ],
      },
    }),
  },
  async run(context) {
    const { serviceId, to, channel } = context.propsValue;

    return await wavixApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      resourcePath: '/v1/two-fa/verification',
      body: {
        service_id: serviceId,
        to,
        channel,
      },
    });
  },
});
