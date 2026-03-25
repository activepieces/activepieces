import { createAction, Property } from '@activepieces/pieces-framework';

import { postmarkAuth } from '../auth';
import { postmarkClient, SendEmailResponse } from '../common/client';
import { normalizeEmails } from '../common/utils';

type SendEmailProps = {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  subject: string;
  textBody?: string;
  htmlBody?: string;
  tag?: string;
  trackOpens?: boolean;
  messageStream?: string;
};

function assertBodyProvided(textBody?: string, htmlBody?: string): void {
  if (!textBody?.trim() && !htmlBody?.trim()) {
    throw new Error('Please provide a text body, an HTML body, or both.');
  }
}

export const sendEmail = createAction({
  name: 'send_email',
  displayName: 'Send Email',
  description: 'Send a single transactional email using Postmark.',
  auth: postmarkAuth,
  props: {
    from: Property.ShortText({
      displayName: 'From',
      description: 'Sender email address configured in Postmark.',
      required: true,
    }),
    to: Property.Array({
      displayName: 'To',
      description: 'Recipient email addresses.',
      required: true,
    }),
    cc: Property.Array({
      displayName: 'CC',
      description: 'Optional CC recipients.',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'BCC',
      description: 'Optional BCC recipients.',
      required: false,
    }),
    replyTo: Property.ShortText({
      displayName: 'Reply To',
      description: 'Optional reply-to email address.',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
    }),
    textBody: Property.LongText({
      displayName: 'Text Body',
      required: false,
    }),
    htmlBody: Property.LongText({
      displayName: 'HTML Body',
      required: false,
    }),
    tag: Property.ShortText({
      displayName: 'Tag',
      required: false,
    }),
    trackOpens: Property.Checkbox({
      displayName: 'Track Opens',
      required: false,
      defaultValue: true,
    }),
    messageStream: Property.ShortText({
      displayName: 'Message Stream',
      description: 'Defaults to outbound if omitted.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue as SendEmailProps;
    assertBodyProvided(props.textBody, props.htmlBody);

    const payload = {
      From: props.from,
      To: normalizeEmails(props.to),
      Cc: normalizeEmails(props.cc),
      Bcc: normalizeEmails(props.bcc),
      ReplyTo: props.replyTo?.trim() || undefined,
      Subject: props.subject,
      TextBody: props.textBody?.trim() || undefined,
      HtmlBody: props.htmlBody?.trim() || undefined,
      Tag: props.tag?.trim() || undefined,
      TrackOpens: props.trackOpens,
      MessageStream: props.messageStream?.trim() || 'outbound',
    };

    const response = await postmarkClient.post<SendEmailResponse>(
      context.auth.secret_text,
      '/email',
      payload
    );

    return {
      success: response.ErrorCode === 0,
      response,
    };
  },
});
