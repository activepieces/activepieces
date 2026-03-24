import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gorgiasAuth } from '../auth';
import { gorgiasApiCall } from '../common/client';
import {
  GORGIAS_CHANNEL_OPTIONS,
  GORGIAS_TICKET_STATUS_OPTIONS,
} from '../common/constants';

export const updateTicketAction = createAction({
  auth: gorgiasAuth,
  name: 'update_gorgias_ticket',
  displayName: 'Update Ticket',
  description: 'Update a Gorgias ticket.',
  props: {
    ticketId: Property.Number({
      displayName: 'Ticket ID',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: GORGIAS_TICKET_STATUS_OPTIONS,
    }),
    channel: Property.StaticDropdown({
      displayName: 'Channel',
      required: false,
      options: GORGIAS_CHANNEL_OPTIONS,
    }),
    customerId: Property.Number({
      displayName: 'Customer ID',
      description: 'Optional customer ID to attach to the ticket.',
      required: false,
    }),
    customerEmail: Property.ShortText({
      displayName: 'Customer Email',
      description: 'Optional customer email to attach alongside the customer ID.',
      required: false,
    }),
    fromAgent: Property.Checkbox({
      displayName: 'From Agent',
      description: 'Whether the first message of the ticket was sent by your company.',
      required: false,
    }),
    isUnread: Property.Checkbox({
      displayName: 'Is Unread',
      required: false,
    }),
    spam: Property.Checkbox({
      displayName: 'Spam',
      required: false,
    }),
    externalId: Property.ShortText({
      displayName: 'External ID',
      required: false,
    }),
  },
  async run(context) {
    const {
      ticketId,
      subject,
      status,
      channel,
      customerId,
      customerEmail,
      fromAgent,
      isUnread,
      spam,
      externalId,
    } = context.propsValue;

    return await gorgiasApiCall({
      auth: context.auth.props,
      method: HttpMethod.PUT,
      resourceUri: `/tickets/${ticketId}`,
      body: {
        subject,
        status,
        channel,
        external_id: externalId,
        from_agent: fromAgent,
        is_unread: isUnread,
        spam,
        customer: customerId
          ? {
              id: customerId,
              email: customerEmail,
            }
          : undefined,
      },
    });
  },
});
