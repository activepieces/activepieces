import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { getApiKey, getBaseUrl, sendgridAuth } from '../common';
import Mail from 'nodemailer/lib/mailer';
import mime from 'mime-types';

export const sendDynamicTemplate = createAction({
  auth: sendgridAuth,
  name: 'send_dynamic_template',
  classification: 'WRITE',
  displayName: 'Send Dynamic Template',
  description: 'Send an email using a dynamic template',
  audience: 'both',
  aiMetadata: { description: 'Sends an email rendered from a SendGrid dynamic template, merging the provided JSON template data into the template referenced by its ID. Use when the message design lives in SendGrid and you only need to supply variables; for composing the body inline use Send Email instead. Requires a valid template ID, a verified sender, and at least one recipient. Not idempotent — each call dispatches a new email.', idempotent: false },
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
      key: 'template',
      display: 'section',
      label: 'Template',
      icon: 'file',
      props: ['template_id', 'template_data'],
    },
  ],
  props: {
    to: Property.Array({
      displayName: 'To',
      description: "Each address gets its own copy; recipients don't see each other.",
      required: true,
    }),
    from_name: Property.ShortText({
      displayName: 'Sender Name',
      description: 'Name recipients see next to the From address.',
      placeholder: 'Acme Support',
      width: 'half',
      required: false,
    }),
    from: Property.ShortText({
      displayName: 'From',
      description: 'Must be a verified sender in your SendGrid account.',
      placeholder: 'you@example.com',
      width: 'half',
      required: true,
    }),
    template_id: Property.ShortText({
      displayName: 'Template ID',
      description: 'Find it in SendGrid under Email API > Dynamic Templates.',
      placeholder: 'd-1234567890abcdef1234567890abcdef',
      required: true,
    }),
    template_data: Property.Json({
      displayName: 'Template Data',
      description: 'JSON whose keys match the variables in your template.',
      required: true,
    }),
    reply_to: Property.ShortText({
      displayName: 'Reply To',
      description: 'Empty: replies go to the From address.',
      placeholder: 'support@example.com',
      required: false,
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
    const { to, from, template_id, template_data, reply_to, from_name, attachments = [] } =
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

    const message = {
      personalizations: to.map((email) => ({
        to: [{ email: (email as string).trim() }],
        dynamic_template_data: template_data,
      })),
      from: { email: from, name: from_name || undefined },
      reply_to: { email: reply_to || from },
      template_id,
      ...(attachment_data && attachment_data.length > 0 && { attachments: attachment_data }),
    };

    await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${getBaseUrl(context.auth)}/mail/send`,
      body: message,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: getApiKey(context.auth),
      },
      queryParams: {},
    });
    return {
      success: true,
    };
  },
});
