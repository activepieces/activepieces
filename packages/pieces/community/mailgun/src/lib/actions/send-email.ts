import { createAction, Property } from '@activepieces/pieces-framework';
import { mailgunAuth } from '../auth';
import { createMailgunClient, MailgunSendResponse } from '../common/client';

export const sendEmailAction = createAction({
  auth: mailgunAuth,
  name: 'send_email',
  displayName: 'Send Email',
  description: 'Send an email with Mailgun.',
  props: {
    from: Property.ShortText({
      displayName: 'From',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'To',
      description: 'Comma-separated recipient email addresses.',
      required: true,
    }),
    cc: Property.ShortText({
      displayName: 'CC',
      description: 'Comma-separated CC recipients.',
      required: false,
    }),
    bcc: Property.ShortText({
      displayName: 'BCC',
      description: 'Comma-separated BCC recipients.',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Text Body',
      required: false,
    }),
    html: Property.LongText({
      displayName: 'HTML Body',
      required: false,
    }),
    template: Property.ShortText({
      displayName: 'Template',
      required: false,
    }),
    templateVariables: Property.Json({
      displayName: 'Template Variables',
      required: false,
    }),
  },
  async run(context) {
    if (!context.propsValue.text && !context.propsValue.html && !context.propsValue.template) {
      throw new Error('Provide at least one of Text Body, HTML Body, or Template.');
    }

    const client = createMailgunClient(context.auth.props);
    const templateVariables = context.propsValue.templateVariables;

    const messageData = {
      from: context.propsValue.from,
      to: context.propsValue.to.split(',').map((value) => value.trim()).filter(Boolean),
      cc: context.propsValue.cc
        ? context.propsValue.cc.split(',').map((value) => value.trim()).filter(Boolean)
        : undefined,
      bcc: context.propsValue.bcc
        ? context.propsValue.bcc.split(',').map((value) => value.trim()).filter(Boolean)
        : undefined,
      subject: context.propsValue.subject,
      text: context.propsValue.text,
      html: context.propsValue.html,
      ...(context.propsValue.template ? { template: context.propsValue.template } : {}),
      ...(templateVariables && typeof templateVariables === 'object'
        ? { 't:variables': JSON.stringify(templateVariables) }
        : {}),
    };

    return (await client.messages.create(
      context.auth.props.domain,
      messageData as Parameters<typeof client.messages.create>[1]
    )) as unknown as MailgunSendResponse;
  },
});
