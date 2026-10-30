import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
  HttpRequest,
} from '@activepieces/pieces-common';
import { getApiKey, getBaseUrl, sendgridAuth } from '../common';
import Mail from 'nodemailer/lib/mailer';
import mime from 'mime-types';

export const sendEmail = createAction({
  auth: sendgridAuth,
  name: 'send_email',
  classification: 'WRITE',
  displayName: 'Send Email',
  description: 'Send a text or HTML email',
  audience: 'both',
  aiMetadata: { description: 'Sends a one-off email via SendGrid with subject and body supplied inline, choosing plain-text or HTML content. Use to send transactional or ad-hoc messages where you compose the body directly; for prebuilt designs with merge variables use Send Dynamic Template instead. Requires a verified sender address and at least one recipient; optional file attachments are supported. Not idempotent — each call dispatches a new email.', idempotent: false },
  propertyGroups: [
    {
      key: 'sender',
      display: 'section',
      label: 'Sender',
      icon: 'user',
      props: ['from', 'from_name'],
    },
    {
      key: 'recipients',
      display: 'section',
      label: 'Send to',
      icon: 'send',
      props: ['to', 'reply_to'],
    },
    {
      key: 'message',
      display: 'section',
      label: 'Message',
      icon: 'text',
      props: ['subject', 'content_type', 'content'],
    },
  ],
  props: {
    to: Property.Array({
      displayName: 'To',
      description: "Each address gets its own copy; recipients don't see each other.",
      required: true,
    }),
    from: Property.ShortText({
      displayName: 'From',
      description: 'Must be a verified sender in your SendGrid account.',
      placeholder: 'you@example.com',
      width: 'half',
      required: true,
    }),
    from_name: Property.ShortText({
      displayName: 'Sender Name',
      description: 'Name recipients see next to the From address.',
      placeholder: 'Acme Support',
      width: 'half',
      required: false,
    }),
    reply_to: Property.ShortText({
      displayName: 'Reply To',
      description: 'Empty: replies go to the From address.',
      placeholder: 'support@example.com',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      placeholder: 'Your order has shipped',
      required: true,
    }),
    content_type: Property.Dropdown<'text' | 'html', true, typeof sendgridAuth>({
      displayName: 'Body Type',
      refreshers: [],
      required: true,
      defaultValue: 'text',
      auth: sendgridAuth,
      options: async () => {
        return {
          disabled: false,
          options: [
            { label: 'Plain Text', value: 'text' },
            { label: 'HTML', value: 'html' },
          ],
        };
      },
    }),
    content: Property.ShortText({
      displayName: 'Body',
      description: 'Write HTML here when Body Type is HTML.',
      placeholder: 'Thanks for your order!',
      required: true,
    }),
    attachments: Property.Array({
      displayName: 'Attachments',
      required: false,
      properties: {
        file: Property.File({
          displayName: 'File',
          description: 'Upload a file or paste its URL.',
          required: true,
        }),
        name: Property.ShortText({
          displayName: 'File Name',
          description: "Empty: keeps the file's own name.",
          placeholder: 'invoice.pdf',
          required: false,
        }),
      }
    }),
  },
  async run(context) {
    const { to, from, from_name, reply_to, subject, content_type, content, attachments = [] } =
      context.propsValue;

    const attachment_data: Mail.Attachment[] = (attachments as { file: ApFile; name?: string }[])
      .map(({file, name}) => {
        const lookupResult = mime.lookup(
          file.extension ? file.extension : ''
        );
        return {
          filename: name || file.filename,
          content: file?.base64,
          type: lookupResult ? lookupResult : undefined,
        };
      });

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${getBaseUrl(context.auth)}/mail/send`,
      body: {
        personalizations: to.map((x) => {
          return {
            to: [
              {
                email: (x as string).trim(),
              },
            ],
          };
        }),
        from: {
          email: from,
          name: from_name || undefined,
        },
        reply_to: {
          email: reply_to || from,
        },
        subject: subject,
        content: [
          {
            type: content_type == 'text' ? 'text/plain' : 'text/html',
            value: content,
          },
        ],
        ...(attachment_data && attachment_data.length > 0 && { attachments: attachment_data }),
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: getApiKey(context.auth),
      },
      queryParams: {},
    };
    await httpClient.sendRequest(request);

    return {
      success: true,
    };
  },
});
