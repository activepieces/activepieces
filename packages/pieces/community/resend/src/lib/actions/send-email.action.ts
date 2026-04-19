import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { resendAuth } from '../..';

export const sendEmail = createAction({
  name: 'send_email',
  auth: resendAuth,
  displayName: 'Send Email',
  description: 'Send a transactional email via Resend',
  props: {
    from: Property.ShortText({ displayName: 'From', description: 'Sender email (e.g. you@yourdomain.com)', required: true }),
    to: Property.ShortText({ displayName: 'To', description: 'Recipient email address', required: true }),
    subject: Property.ShortText({ displayName: 'Subject', required: true }),
    html: Property.LongText({ displayName: 'HTML Body', description: 'Email body in HTML format', required: false }),
    text: Property.LongText({ displayName: 'Text Body', description: 'Plain text email body', required: false }),
    reply_to: Property.ShortText({ displayName: 'Reply To', required: false }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      from: propsValue.from,
      to: propsValue.to,
      subject: propsValue.subject,
    };
    if (propsValue.html) body['html'] = propsValue.html;
    if (propsValue.text) body['text'] = propsValue.text;
    if (propsValue.reply_to) body['reply_to'] = propsValue.reply_to;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.resend.com/emails',
      headers: { Authorization: `Bearer ${auth}`, 'Content-Type': 'application/json' },
      body,
    });
    return response.body;
  },
});
