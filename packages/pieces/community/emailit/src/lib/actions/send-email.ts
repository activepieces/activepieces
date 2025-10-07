import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { emailitAuth } from '../../index';

export const sendEmail = createAction({
  name: 'send-email',
  displayName: 'Send Email',
  description: 'Send an email using EmailIt API',
  auth: emailitAuth,
  props: {
    fromName: Property.ShortText({
      displayName: 'From Name',
      description: 'The name of the sender',
      required: true,
    }),
    fromEmail: Property.ShortText({
      displayName: 'From Email',
      description: 'The email address of the sender',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'To Email',
      description: 'The recipient email address',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The email subject',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'The email body (HTML supported)',
      required: true,
    }),
    replyTo: Property.ShortText({
      displayName: 'Reply-To Email',
      description: 'Optional reply-to email address',
      required: false,
    }),
  },
  async run(context) {
    const { fromName, fromEmail, to, subject, body, replyTo } = context.propsValue;
    const apiKey = context.auth;

    try {
      const response = await fetch('https://api.emailit.com/v1/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: to,
          subject: subject,
          html: body,
          ...(replyTo && { reply_to: replyTo }),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: 'Email sent successfully',
        data: data,
      };
    } catch (error) {
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});