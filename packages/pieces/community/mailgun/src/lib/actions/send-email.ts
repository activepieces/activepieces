import { createAction, Property } from '@activepieces/pieces-framework';
import { mailgunAuth } from '../..';
import { mailgunCommon, mailgunApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const sendEmail = createAction({
  auth: mailgunAuth,
  name: 'send_email',
  displayName: 'Send Email',
  description: 'Send an email using your Mailgun domain',
  props: {
    domain: mailgunCommon.domainDropdown,
    from: Property.ShortText({
      displayName: 'From',
      description:
        'Sender email address, e.g. "Your Name <you@yourdomain.com>"',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'To Email Address',
      description:
        'Recipient email address. For multiple recipients, separate with commas.',
      required: true,
    }),
    cc: Property.ShortText({
      displayName: 'CC Email Address',
      description: 'Carbon copy recipients, separated by commas.',
      required: false,
    }),
    bcc: Property.ShortText({
      displayName: 'BCC Email Address',
      description: 'Blind carbon copy recipients, separated by commas.',
      required: false,
    }),
    replyTo: Property.ShortText({
      displayName: 'Reply-To Email Address',
      description: 'Email address for replies.',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Email Subject',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Email Body (Plain Text)',
      description: 'Plain text version of the email body.',
      required: false,
    }),
    html: Property.LongText({
      displayName: 'Email Body (HTML)',
      description: 'HTML version of the email body.',
      required: false,
    }),
  },
  async run(context) {
    const { domain, from, to, cc, bcc, replyTo, subject, text, html } =
      context.propsValue;
    const auth = context.auth;

    if (!text && !html) {
      throw new Error(
        'Please provide either a plain text or HTML body for the email.',
      );
    }

    const bodyFields: Record<string, string> = {
      from,
      to,
      subject,
    };
    if (cc) bodyFields['cc'] = cc;
    if (bcc) bodyFields['bcc'] = bcc;
    if (replyTo) bodyFields['h:Reply-To'] = replyTo;
    if (text) bodyFields['text'] = text;
    if (html) bodyFields['html'] = html;

    const response = await mailgunApiCall<{
      id: string;
      message: string;
    }>({
      apiKey: auth.props.api_key,
      region: auth.props.region,
      method: HttpMethod.POST,
      path: `/v3/${domain}/messages`,
      body: new URLSearchParams(bodyFields).toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return {
      message_id: response.body.id,
      message: response.body.message,
    };
  },
});
