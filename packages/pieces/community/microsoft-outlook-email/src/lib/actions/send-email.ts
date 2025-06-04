import { createAction, Property } from '@activepieces/pieces-framework';
import { outlookEmailAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const sendEmail = createAction({
  auth: outlookEmailAuth,
  name: 'send-email',
  displayName: 'Send Email',
  description: 'Send an outlook email with advanced options (attachments, draft, etc.)',
  props: {
    to: Property.ShortText({
      displayName: 'Receiver Email (To)',
      required: true,
      description: 'Recipient email address(es), comma-separated',
    }),
    cc: Property.ShortText({
      displayName: 'CC',
      required: false,
    }),
    bcc: Property.ShortText({
      displayName: 'BCC',
      required: false,
    }),
    sender_name: Property.ShortText({
      displayName: 'Sender Name',
      required: false,
    }),
    from: Property.ShortText({
      displayName: 'Sender Email',
      description: 'Used for delegated/shared mailboxes only',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      required: true,
    }),
    attachment: Property.File({
      displayName: 'Attachment',
      required: false,
    }),
    attachment_name: Property.ShortText({
      displayName: 'Attachment Name',
      required: false,
    }),
    draft: Property.Checkbox({
      displayName: 'Create Draft',
      description: 'If true, creates draft without sending',
      required: true,
      defaultValue: false,
    }),
  },

  async run(context) {
    const { propsValue, auth } = context;

    const formatEmails = (input: string | string[] | undefined) => {
      if (!input) return [];
      if (Array.isArray(input)) {
        return input.map((email) => ({
          emailAddress: { address: email.trim() },
        }));
      }
      return input
        .split(',')
        .map((email) => ({ emailAddress: { address: email.trim() } }));
    };

    const {
      to,
      cc,
      bcc,
      from,
      sender_name,
      subject,
      body,
      attachment,
      attachment_name,
      draft,
    } = propsValue;

    const message: any = {
      subject,
      body: {
        contentType: 'HTML',
        content: body,
      },
      toRecipients: formatEmails(to),
      attachment,
    };

    if (cc) message.ccRecipients = formatEmails(cc);
    if (bcc) message.bccRecipients = formatEmails(bcc);
    if (from) {
      message.from = {
        emailAddress: {
          name: sender_name || undefined,
          address: from,
        },
      };
    }

    const url = draft
      ? 'https://graph.microsoft.com/v1.0/me/messages'
      : 'https://graph.microsoft.com/v1.0/me/sendMail';

    const bodyData = draft ? message : { message };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: bodyData,
    });

    return response.body;
  },
});
