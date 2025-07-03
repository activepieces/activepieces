import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { clicksendAuth } from './common/auth';

export const sendMms = createAction({
  auth: clicksendAuth,
  name: 'sendMms',
  displayName: 'Send MMS',
  description: 'Send one or more MMS messages via ClickSend',
  props: {
    media_file: Property.ShortText({
      displayName: 'Media File URL',
      description:
        'URL to the media file (jpg, gif, jpeg, png, bmp, max 250kB)',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Subject line (max 20 characters)',
      required: true,
    }),
    from: Property.ShortText({
      displayName: 'From (Sender ID)',
      description: 'Your sender ID (must be set up in ClickSend)',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Message Body',
      description: 'The message to send',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'Recipient Phone Number',
      description: 'Recipient phone number in E.164 format (e.g. +61411111111)',
      required: true,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Recipient country code (e.g. AU)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { media_file, subject, from, body, to, country } = propsValue;
    const { username, password } = auth;
    const encoded = Buffer.from(`${username}:${password}`).toString('base64');
    const response = await fetch('https://rest.clicksend.com/v3/mms/send', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encoded}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        media_file,
        messages: [
          {
            source: 'api',
            subject,
            from,
            body,
            to,
            country,
          },
        ],
      }),
    });
    const data = await response.json();
    return data;
  },
});
