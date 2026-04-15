import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { lobstermailCommon, fromAddressDropdown } from '../common';
import { lobstermailAuth } from '../..';

export const sendEmail = createAction({
  auth: lobstermailAuth,
  name: 'send_email',
  displayName: 'Send Email',
  description:
    'Send an email from one of your LobsterMail inboxes. Requires a verified account (Tier 1+).',
  props: {
    from: fromAddressDropdown,
    to: Property.Array({
      displayName: 'To',
      description: 'Recipient email addresses (up to 50).',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Email subject line.',
      required: true,
    }),
    body_text: Property.LongText({
      displayName: 'Body (Plain Text)',
      description: 'Plain text version of the email. At least one of Plain Text or HTML body is required.',
      required: false,
    }),
    body_html: Property.LongText({
      displayName: 'Body (HTML)',
      description: 'HTML version of the email. If only HTML is provided, a plain-text version is auto-generated.',
      required: false,
    }),
    cc: Property.Array({
      displayName: 'CC',
      description: 'Additional recipients to CC on the email.',
      required: false,
    }),
    in_reply_to: Property.ShortText({
      displayName: 'In-Reply-To Message ID',
      description:
        'Message-ID of the email you are replying to (for threading). ' +
        'You can get this from the "Get Email" action output.',
      required: false,
    }),
    thread_id: Property.ShortText({
      displayName: 'Thread ID',
      description: 'ID of an existing thread to add this email to. Leave empty to start a new thread.',
      required: false,
    }),
  },
  async run(context) {
    const { from, to, subject, body_text, body_html, cc, in_reply_to, thread_id } =
      context.propsValue;

    if (!body_text && !body_html) {
      throw new Error(
        'At least one of "Body (Plain Text)" or "Body (HTML)" must be provided.',
      );
    }

    const payload: Record<string, unknown> = { from, to, subject };

    const bodyObj: Record<string, string> = {};
    if (body_text) bodyObj['text'] = body_text;
    if (body_html) bodyObj['html'] = body_html;
    payload['body'] = bodyObj;

    if (cc && (cc as string[]).length > 0) payload['cc'] = cc;
    if (in_reply_to) payload['inReplyTo'] = in_reply_to;
    if (thread_id) payload['threadId'] = thread_id;

    const response = await httpClient.sendRequest<{ id: string; status: string }>({
      method: HttpMethod.POST,
      url: `${lobstermailCommon.baseUrl}/v1/emails/send`,
      body: payload,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });

    return response.body;
  },
});
