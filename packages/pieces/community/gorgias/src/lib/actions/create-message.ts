import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gorgiasAuth } from '../auth';
import { gorgiasApiCall } from '../common/client';
import {
  GORGIAS_CHANNEL_OPTIONS,
  GORGIAS_VIA_OPTIONS,
} from '../common/constants';

export const createMessageAction = createAction({
  auth: gorgiasAuth,
  name: 'create_gorgias_ticket_message',
  displayName: 'Create Message',
  description: 'Create a reply or message on an existing Gorgias ticket.',
  props: {
    ticketId: Property.Number({
      displayName: 'Ticket ID',
      required: true,
    }),
    fromAgent: Property.Checkbox({
      displayName: 'From Agent',
      description: 'True when the sender is an agent/user; false when the sender is a customer.',
      required: true,
      defaultValue: true,
    }),
    senderId: Property.Number({
      displayName: 'Sender ID',
      description: 'User ID when From Agent is true, otherwise Customer ID.',
      required: true,
    }),
    receiverId: Property.Number({
      displayName: 'Receiver ID',
      description: 'Customer ID when From Agent is true, otherwise User ID.',
      required: true,
    }),
    fromAddress: Property.ShortText({
      displayName: 'From Address',
      description: 'Email or channel address of the sender.',
      required: true,
    }),
    toAddress: Property.ShortText({
      displayName: 'To Address',
      description: 'Email or channel address of the receiver.',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'Message body. HTML is accepted by the API.',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: false,
    }),
    channel: Property.StaticDropdown({
      displayName: 'Channel',
      required: true,
      options: GORGIAS_CHANNEL_OPTIONS,
      defaultValue: 'email',
    }),
    via: Property.StaticDropdown({
      displayName: 'Via',
      required: true,
      options: GORGIAS_VIA_OPTIONS,
      defaultValue: 'api',
    }),
    sentDatetime: Property.ShortText({
      displayName: 'Sent Datetime',
      description: 'Optional ISO-8601 timestamp for when the message was sent.',
      required: false,
    }),
  },
  async run(context) {
    const {
      ticketId,
      fromAgent,
      senderId,
      receiverId,
      fromAddress,
      toAddress,
      message,
      subject,
      channel,
      via,
      sentDatetime,
    } = context.propsValue;

    return await gorgiasApiCall({
      auth: context.auth.props,
      method: HttpMethod.POST,
      resourceUri: `/tickets/${ticketId}/messages`,
      body: {
        channel,
        body_html: message,
        via,
        subject,
        from_agent: fromAgent,
        sent_datetime: sentDatetime,
        sender: {
          id: senderId,
        },
        receiver: {
          id: receiverId,
        },
        source: {
          from: {
            address: fromAddress,
          },
          to: [
            {
              address: toAddress,
            },
          ],
        },
      },
    });
  },
});
