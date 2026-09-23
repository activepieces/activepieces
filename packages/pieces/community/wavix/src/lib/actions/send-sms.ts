import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wavixAuth } from '../common/auth';
import { wavixApiCall } from '../common/client';

export const sendSms = createAction({
  auth: wavixAuth,
  name: 'send_sms',
  classification: 'WRITE',
  displayName: 'Send SMS or MMS',
  description: 'Send an SMS, or an MMS when media URLs are provided.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends an SMS from a Wavix sender ID to a phone number; attaching one or more media URLs sends it as an MMS instead.',
    idempotent: false,
  },
  props: {
    from: Property.ShortText({
      displayName: 'From (Sender ID)',
      description:
        'A number or an alphanumeric sender ID on your account. Alphanumeric sender IDs are subject to per-country rules.',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'To',
      description: 'Recipient phone number in E.164 format (e.g. +15555550100).',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Message',
      description: 'Message text. Segmentation and encoding are handled by Wavix.',
      required: true,
    }),
    media: Property.Array({
      displayName: 'Media URLs',
      description:
        'Up to 5 media URLs. If any are set, the message is sent as an MMS. Leave empty for a plain SMS.',
      required: false,
    }),
    callbackUrl: Property.ShortText({
      displayName: 'Delivery report URL',
      description:
        'Optional. URL that receives delivery reports for this message. Point it at a "Catch Webhook" trigger to react to delivery status in another flow.',
      required: false,
    }),
    validity: Property.Number({
      displayName: 'Validity (seconds)',
      description:
        'Optional. Delivery attempts stop after this period elapses.',
      required: false,
    }),
    tag: Property.ShortText({
      displayName: 'Tag',
      description: 'Optional. Groups messages, for example by campaign.',
      required: false,
    }),
  },
  async run(context) {
    const { from, to, text, media, callbackUrl, validity, tag } =
      context.propsValue;

    const mediaUrls = (media as string[] | undefined)?.filter(
      (url) => typeof url === 'string' && url.length > 0
    );

    const body = {
      from,
      to,
      message_body: {
        text,
        ...(mediaUrls && mediaUrls.length > 0 ? { media: mediaUrls } : {}),
      },
      ...(callbackUrl ? { callback_url: callbackUrl } : {}),
      ...(validity != null ? { validity } : {}),
      ...(tag ? { tag } : {}),
    };

    return await wavixApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      resourcePath: '/v3/messages',
      body,
    });
  },
});
