import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { zagomailAuth } from '../../index';

export const sendEmailAction = createAction({
  auth: zagomailAuth,
  name: 'send_email',
  displayName: 'Send Email',
  description: 'Send a transactional email to a single recipient',
  props: {
    toEmail: Property.ShortText({
      displayName: 'To Email',
      description: 'The recipient email address',
      required: true,
    }),
    toName: Property.ShortText({
      displayName: 'To Name',
      description: 'The recipient name',
      required: false,
    }),
    fromName: Property.ShortText({
      displayName: 'From Name',
      description: 'The sender name',
      required: true,
    }),
    fromEmail: Property.ShortText({
      displayName: 'From Email',
      description: 'The sender email address',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject line of the email',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Email Content',
      description: 'The HTML content of the email',
      required: true,
    }),
    plainText: Property.LongText({
      displayName: 'Plain Text Version',
      description: 'The plain text version of the email',
      required: false,
    }),
    replyTo: Property.ShortText({
      displayName: 'Reply-To',
      description: 'The reply-to email address',
      required: false,
    }),
    attachments: Property.Array({
      displayName: 'Attachments',
      description: 'Files to attach to the email',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const payload = {
      to: {
        email: propsValue.toEmail,
        name: propsValue.toName,
      },
      from: {
        email: propsValue.fromEmail,
        name: propsValue.fromName,
      },
      subject: propsValue.subject,
      html_content: propsValue.content,
      plain_content: propsValue.plainText,
      reply_to: propsValue.replyTo,
      attachments: propsValue.attachments,
    };

    return await makeRequest(
      auth as string,
      HttpMethod.POST,
      '/transactional/send',
      payload
    );
  },
});
