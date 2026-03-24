import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { plunkAuth } from '../..';

export const plunkSendEmailAction = createAction({
  auth: plunkAuth,
  name: 'plunk_send_email',
  displayName: 'Send Transactional Email',
  description: 'Send a transactional email to one or more recipients.',
  props: {
    to: Property.ShortText({
      displayName: 'To',
      description:
        'Recipient email address. For multiple recipients, use a comma-separated list.',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject line of the email.',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'The HTML body of the email.',
      required: true,
    }),
    from: Property.ShortText({
      displayName: 'From Name',
      description: 'The sender name displayed to the recipient.',
      required: false,
    }),
    reply: Property.ShortText({
      displayName: 'Reply-To',
      description: 'The reply-to email address.',
      required: false,
    }),
    subscribed: Property.Checkbox({
      displayName: 'Subscribed',
      description:
        'Whether the contact should be subscribed to marketing emails.',
      required: false,
      defaultValue: true,
    }),
    name: Property.ShortText({
      displayName: 'Contact Name',
      description:
        'The name of the recipient. Used if the contact is created automatically.',
      required: false,
    }),
  },
  run: async ({ auth, propsValue }) => {
    const body: Record<string, unknown> = {
      to: propsValue.to,
      subject: propsValue.subject,
      body: propsValue.body,
    };

    if (propsValue.subscribed !== undefined) {
      body['subscribed'] = propsValue.subscribed;
    }
    if (propsValue.from) body['from'] = propsValue.from;
    if (propsValue.reply) body['reply'] = propsValue.reply;
    if (propsValue.name) body['name'] = propsValue.name;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.useplunk.com/v1/send',
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});
