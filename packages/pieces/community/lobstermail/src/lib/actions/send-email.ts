import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { lobstermailCommon } from '../common';
import { lobstermailAuth } from '../..';

export const sendEmail = createAction({
  auth: lobstermailAuth,
  name: 'send_email',
  displayName: 'Send Email',
  description:
    'Send an email from a LobsterMail inbox. Requires a verified account (Tier 1+).',
  props: {
    from: Property.ShortText({
      displayName: 'From',
      description: 'Sender email address (must be an active inbox on the account)',
      required: true,
    }),
    to: Property.Array({
      displayName: 'To',
      description: 'Recipient email addresses',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Email subject line',
      required: true,
    }),
    body_text: Property.LongText({
      displayName: 'Body (Plain Text)',
      description: 'Plain text email body',
      required: false,
    }),
    body_html: Property.LongText({
      displayName: 'Body (HTML)',
      description: 'HTML email body',
      required: false,
    }),
    cc: Property.Array({
      displayName: 'CC',
      description: 'CC recipients',
      required: false,
    }),
    in_reply_to: Property.ShortText({
      displayName: 'In-Reply-To',
      description: 'Message-ID of the email being replied to',
      required: false,
    }),
  },
  async run(context) {
    const { from, to, subject, body_text, body_html, cc, in_reply_to } =
      context.propsValue;

    const body: Record<string, unknown> = {
      from,
      to,
      subject,
      body: {} as Record<string, string>,
    };
    if (body_text) (body['body'] as Record<string, string>)['text'] = body_text;
    if (body_html) (body['body'] as Record<string, string>)['html'] = body_html;
    if (cc && (cc as string[]).length > 0) body['cc'] = cc;
    if (in_reply_to) body['inReplyTo'] = in_reply_to;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${lobstermailCommon.baseUrl}/v1/emails/send`,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
    });

    return response.body;
  },
});
