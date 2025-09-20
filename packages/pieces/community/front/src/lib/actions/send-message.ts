import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { frontProps } from '../common/props';

export const sendMessage = createAction({
  auth: frontAuth,
  name: 'send_message',
  displayName: 'Send Message',
  description:
    'Send a new message from a channel, starting a new conversation.',
  props: {
    channel_id: frontProps.channel(),
    to: Property.Array({
      displayName: 'To',
      description: 'List of recipient email addresses.',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Body (HTML)',
      description: 'The content of the message. HTML is supported.',
      required: true,
    }),
    author_id: frontProps.teammate({ required: false }),
    cc: Property.Array({
      displayName: 'CC',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'BCC',
      required: false,
    }),
    sender_name: Property.ShortText({
      displayName: 'Sender Name',
      description: 'Overrides the default sender name for the channel.',
      required: false,
    }),
    text: Property.LongText({
      displayName: 'Plain Text Body',
      description:
        'A plain text version of the body. Recommended for compatibility.',
      required: false,
    }),
    tag_ids: frontProps.tags({ required: false }),
    options: Property.Json({
      displayName: 'Options',
      description: 'Additional sending options. Example: {"archive": true}',
      required: false,
    }),
  },
  async run(context) {
    const { channel_id, ...body } = context.propsValue;
    const token = context.auth;
    const requestBody: Record<string, unknown> = { ...body };

    Object.keys(requestBody).forEach((key) => {
      const value = requestBody[key];
      if (value === undefined || (Array.isArray(value) && value.length === 0)) {
        delete requestBody[key];
      }
    });

    return await makeRequest(
      token,
      HttpMethod.POST,
      `/channels/${channel_id}/messages`,
      requestBody
    );
  },
});
