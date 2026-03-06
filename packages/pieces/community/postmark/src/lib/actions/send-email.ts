import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postmarkAuth } from '../auth';
import { postmarkApiRequest } from '../common';

export const sendEmail = createAction({
  auth: postmarkAuth,
  name: 'send_email',
  displayName: 'Send Email',
  description: 'Send a transactional email through Postmark',
  props: {
    from: Property.ShortText({
      displayName: 'From',
      description:
        'Sender email address (must be a confirmed Sender Signature). Format: "Name <email>" or just "email"',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'To',
      description:
        'Recipient email addresses (comma-separated, max 50)',
      required: true,
    }),
    cc: Property.ShortText({
      displayName: 'CC',
      description: 'CC recipients (comma-separated)',
      required: false,
    }),
    bcc: Property.ShortText({
      displayName: 'BCC',
      description: 'BCC recipients (comma-separated)',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Email subject line',
      required: true,
    }),
    htmlBody: Property.LongText({
      displayName: 'HTML Body',
      description: 'HTML content of the email',
      required: false,
    }),
    textBody: Property.LongText({
      displayName: 'Text Body',
      description: 'Plain text content of the email',
      required: false,
    }),
    replyTo: Property.ShortText({
      displayName: 'Reply To',
      description: 'Reply-to email address',
      required: false,
    }),
    tag: Property.ShortText({
      displayName: 'Tag',
      description: 'Tag for categorizing this email',
      required: false,
    }),
    trackOpens: Property.Checkbox({
      displayName: 'Track Opens',
      description: 'Enable open tracking for this email',
      required: false,
      defaultValue: false,
    }),
    trackLinks: Property.StaticDropdown({
      displayName: 'Track Links',
      description: 'Link tracking mode',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'None', value: 'None' },
          { label: 'HTML and Text', value: 'HtmlAndText' },
          { label: 'HTML Only', value: 'HtmlOnly' },
          { label: 'Text Only', value: 'TextOnly' },
        ],
      },
    }),
    messageStream: Property.ShortText({
      displayName: 'Message Stream',
      description:
        'Message stream ID (defaults to "outbound")',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      From: context.propsValue.from,
      To: context.propsValue.to,
      Subject: context.propsValue.subject,
    };

    if (context.propsValue.cc) body['Cc'] = context.propsValue.cc;
    if (context.propsValue.bcc) body['Bcc'] = context.propsValue.bcc;
    if (context.propsValue.htmlBody)
      body['HtmlBody'] = context.propsValue.htmlBody;
    if (context.propsValue.textBody)
      body['TextBody'] = context.propsValue.textBody;
    if (context.propsValue.replyTo)
      body['ReplyTo'] = context.propsValue.replyTo;
    if (context.propsValue.tag) body['Tag'] = context.propsValue.tag;
    if (context.propsValue.trackOpens)
      body['TrackOpens'] = context.propsValue.trackOpens;
    if (context.propsValue.trackLinks)
      body['TrackLinks'] = context.propsValue.trackLinks;
    if (context.propsValue.messageStream)
      body['MessageStream'] = context.propsValue.messageStream;

    return await postmarkApiRequest({
      apiKey: context.auth,
      method: HttpMethod.POST,
      endpoint: '/email',
      body,
    });
  },
});
