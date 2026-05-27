import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil, spreadIfNotUndefined } from '@activepieces/shared';
import { gorgiasAuth } from '../../';
import { gorgiasApi } from '../common/client';
import { gorgiasProps } from '../common/props';
import { gorgiasTicket, GorgiasTicket } from '../common/ticket';

export const updateTicket = createAction({
  auth: gorgiasAuth,
  name: 'update_ticket',
  displayName: 'Update Ticket',
  description: 'Update the status, priority, subject, or assignee of a ticket.',
  props: {
    ticket_id: gorgiasProps.ticketId(true),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Leave empty to keep the current status.',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'Leave empty to keep the current priority.',
      required: false,
      options: {
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Normal', value: 'normal' },
          { label: 'High', value: 'high' },
          { label: 'Critical', value: 'critical' },
        ],
      },
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Leave empty to keep the current subject.',
      required: false,
    }),
    assignee_user: gorgiasProps.assigneeUserId(false),
  },
  async run(context) {
    const { ticket_id, status, priority, subject, assignee_user } = context.propsValue;

    const response = await gorgiasApi.call<GorgiasTicket>({
      auth: context.auth.props,
      method: HttpMethod.PUT,
      path: `/tickets/${ticket_id}`,
      body: {
        ...spreadIfNotUndefined('status', status),
        ...spreadIfNotUndefined('priority', priority),
        ...spreadIfNotUndefined('subject', subject),
        ...(isNil(assignee_user) ? {} : { assignee_user: { id: assignee_user } }),
      },
    });

    return gorgiasTicket.flattenTicket(response.body);
  },
});
