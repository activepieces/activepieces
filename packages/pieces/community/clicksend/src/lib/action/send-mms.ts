import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callClickSendApi, clicksendCommon } from '../common';
import { clicksendAuth } from '../..';

export const clicksendSendMms = createAction({
  auth: clicksendAuth,
  name: 'send_mms',
  classification: 'WRITE',
  description: 'Send an MMS with an image to one phone number.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends an MMS multimedia message via ClickSend to a recipient phone number, attaching a media file referenced by URL along with a subject and body. Choose this over Send SMS when the message must include an image, video, or other media. Requires a publicly reachable media URL; not idempotent, as each call dispatches the message again.',
    idempotent: false,
  },
  displayName: 'Send MMS',
  propertyGroups: [
    {
      key: 'recipient',
      display: 'section',
      label: 'Send to',
      icon: 'send',
      props: ['to'],
    },
    {
      key: 'message',
      display: 'section',
      label: 'Message',
      icon: 'text',
      props: ['from', 'subject', 'body', 'media_url'],
    },
  ],
  props: {
    to: Property.ShortText({
      description: 'International format, with the country code.',
      placeholder: '+14155550123',
      displayName: 'To',
      required: true,
    }),
    body: Property.ShortText({
      displayName: 'Message Body',
      required: true,
    }),
    subject: Property.ShortText({
      description: 'Up to 20 characters.',
      displayName: 'Subject',
      required: true,
    }),
    from: clicksendCommon.sender_id,
    media_url: Property.ShortText({
      description: 'Public link to a JPG or GIF, up to 250 KB.',
      placeholder: 'https://example.com/photo.jpg',
      displayName: 'Media URL',
      required: true,
    }),
  },
  async run(context) {
    const {
      to,
      body,
      from,
      media_url,
      subject,
    } = context.propsValue;

    const username = context.auth.username;
    const password = context.auth.password;

    // Validate each message

    if (!to || !body || !media_url) {
      throw new Error(
        'Each message must have a recipient (to), body, and media_url.'
      );
    }

    try {
      const response = await callClickSendApi({
        method: HttpMethod.POST,
        path: '/mms/send',
        username,
        password,
        body: {
          media_file:media_url,
          messages:[{
            subject,
            from,
            body,
            to}
          ]
        },
      });
      return response.body;
    } catch (error: any) {
      // Handle ClickSend API errors and provide meaningful feedback
      if (error?.response?.body?.response_msg) {
        throw new Error(
          `ClickSend API error: ${error.response.body.response_msg}`
        );
      }
      throw error;
    }
  },
});

