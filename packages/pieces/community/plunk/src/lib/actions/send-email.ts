import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { plunkAuth, PLUNK_BASE_URL } from '../../index';

export const sendTransactionalEmail = createAction({
  auth: plunkAuth,
  name: 'send_transactional_email',
  displayName: 'Send Transactional Email',
  description:
    'Send a transactional email through Plunk. Recipient can be a single address or a comma-separated list.',
  props: {
    to: Property.ShortText({
      displayName: 'To',
      description: 'Recipient email address. For multiple recipients, separate with commas.',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'HTML body of the email.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Sender Name',
      description: 'Optional sender name. Falls back to the project default.',
      required: false,
    }),
    from: Property.ShortText({
      displayName: 'Sender Email (From)',
      description: 'Optional sender email. Must be a verified address on your Plunk project.',
      required: false,
    }),
    reply: Property.ShortText({
      displayName: 'Reply-To',
      description: 'Optional reply-to email.',
      required: false,
    }),
    subscribed: Property.Checkbox({
      displayName: 'Mark Recipient as Subscribed',
      description:
        'When enabled, Plunk creates the recipient as a subscribed contact if they do not already exist.',
      required: false,
    }),
  },
  async run(context) {
    const { to, subject, body, name, from, reply, subscribed } =
      context.propsValue;

    const recipients = to
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    const requestBody: Record<string, unknown> = {
      to: recipients.length === 1 ? recipients[0] : recipients,
      subject,
      body,
    };
    if (name) requestBody['name'] = name;
    if (from) requestBody['from'] = from;
    if (reply) requestBody['reply'] = reply;
    if (subscribed === true) requestBody['subscribed'] = true;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${PLUNK_BASE_URL}/send`,
      body: requestBody,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.props.secretKey,
      },
    });
    return response.body;
  },
});
