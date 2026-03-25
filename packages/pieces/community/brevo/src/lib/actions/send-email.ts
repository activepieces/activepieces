import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { brevoAuth } from '../auth';
import { brevoRequest, compactObject } from '../common/client';

export const sendEmailAction = createAction({
  name: 'send_email',
  displayName: 'Send Email',
  description: 'Send a transactional email using Brevo SMTP API.',
  auth: brevoAuth,
  props: {
    senderEmail: Property.ShortText({ displayName: 'Sender Email', required: true }),
    senderName: Property.ShortText({ displayName: 'Sender Name', required: false }),
    recipientEmail: Property.ShortText({ displayName: 'Recipient Email', required: true }),
    recipientName: Property.ShortText({ displayName: 'Recipient Name', required: false }),
    subject: Property.ShortText({ displayName: 'Subject', required: true }),
    htmlContent: Property.LongText({ displayName: 'HTML Content', required: false }),
    textContent: Property.LongText({ displayName: 'Text Content', required: false }),
  },
  async run(context) {
    if (!context.propsValue.htmlContent && !context.propsValue.textContent) {
      throw new Error('Provide either HTML Content or Text Content.');
    }
    return brevoRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/smtp/email',
      body: compactObject({
        sender: compactObject({
          email: context.propsValue.senderEmail,
          name: context.propsValue.senderName,
        }),
        to: [compactObject({ email: context.propsValue.recipientEmail, name: context.propsValue.recipientName })],
        subject: context.propsValue.subject,
        htmlContent: context.propsValue.htmlContent,
        textContent: context.propsValue.textContent,
      }),
    });
  },
});
