import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { gorgiasAuth } from '../../';
import { gorgiasApi } from '../common/client';
import { gorgiasProps } from '../common/props';

export const addMessage = createAction({
  auth: gorgiasAuth,
  name: 'add_message',
  displayName: 'Add Message to Ticket',
  description: 'Reply to a ticket or add an internal note that only agents can see.',
  props: {
    ticket_id: gorgiasProps.ticketId(true),
    message_type: Property.StaticDropdown({
      displayName: 'Message Type',
      description:
        'A public reply is sent to the customer. An internal note stays private to your team.',
      required: true,
      defaultValue: 'reply',
      options: {
        options: [
          { label: 'Public reply to customer', value: 'reply' },
          { label: 'Internal note (agents only)', value: 'note' },
        ],
      },
    }),
    body_text: Property.LongText({
      displayName: 'Message',
      description: 'The content of the message.',
      required: true,
    }),
    channel: Property.StaticDropdown({
      displayName: 'Channel',
      description: 'The channel to send a public reply through. Ignored for internal notes.',
      required: false,
      defaultValue: 'email',
      options: {
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Chat', value: 'chat' },
          { label: 'SMS', value: 'sms' },
          { label: 'Facebook', value: 'facebook' },
          { label: 'Instagram', value: 'instagram' },
          { label: 'Twitter', value: 'twitter' },
          { label: 'WhatsApp', value: 'whatsapp' },
        ],
      },
    }),
  },
  async run(context) {
    const { ticket_id, message_type, body_text, channel } = context.propsValue;
    const isNote = message_type === 'note';

    const response = await gorgiasApi.call({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: `/tickets/${ticket_id}/messages`,
      body: {
        channel: isNote ? 'internal-note' : channel ?? 'email',
        via: isNote ? 'internal-note' : channel ?? 'email',
        from_agent: true,
        body_text,
        public: !isNote,
      },
    });

    return response.body;
  },
});
