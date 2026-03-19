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

    if (!body_text && !body_html) {
      throw new Error(
        'At least one of "Body (Plain Text)" or "Body (HTML)" must be provided.',
      );
    }

    const payload: Record<string, unknown> = {
      from,
      to,
      subject,
    };

    const bodyObj: Record<string, string> = {};
    if (body_text) bodyObj['text'] = body_text;
    if (body_html) bodyObj['html'] = body_html;
    if (Object.keys(bodyObj).length > 0) {
      payload['body'] = bodyObj;
    }

    if (cc && (cc as string[]).length > 0) payload['cc'] = cc;
    if (in_reply_to) payload['inReplyTo'] = in_reply_to;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${lobstermailCommon.baseUrl}/v1/emails/send`,
      body: payload,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
    });

    return response.body;
  },
});
