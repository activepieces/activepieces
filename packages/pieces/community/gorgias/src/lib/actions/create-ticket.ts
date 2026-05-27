import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { gorgiasAuth } from '../../';
import { gorgiasApi } from '../common/client';
import { gorgiasProps } from '../common/props';
import { gorgiasTicket, GorgiasTicket } from '../common/ticket';

export const createTicket = createAction({
  auth: gorgiasAuth,
  name: 'create_ticket',
  displayName: 'Create Ticket',
  description: 'Create a new support ticket with an initial message.',
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject line of the ticket (max 998 characters).',
      required: true,
    }),
    customer_email: Property.ShortText({
      displayName: 'Customer Email',
      description:
        'Email address of the customer this ticket is for. If no customer with this email exists, one is created.',
      required: true,
    }),
    customer_name: Property.ShortText({
      displayName: 'Customer Name',
      description: 'Full name of the customer. Used only when creating a new customer.',
      required: false,
    }),
    body_text: Property.LongText({
      displayName: 'Message',
      description: 'The body of the first message in the ticket.',
      required: true,
    }),
    channel: Property.StaticDropdown({
      displayName: 'Channel',
      description: 'The channel the conversation came through.',
      required: true,
      defaultValue: 'email',
      options: {
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' },
          { label: 'Chat', value: 'chat' },
          { label: 'SMS', value: 'sms' },
          { label: 'Facebook', value: 'facebook' },
          { label: 'Instagram', value: 'instagram' },
          { label: 'Twitter', value: 'twitter' },
          { label: 'WhatsApp', value: 'whatsapp' },
          { label: 'API', value: 'api' },
        ],
      },
    }),
    from_agent: Property.Checkbox({
      displayName: 'Message From Agent',
      description: 'Enable if the first message was written by your company rather than the customer.',
      required: false,
      defaultValue: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      defaultValue: 'open',
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      required: false,
      defaultValue: 'normal',
      options: {
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Normal', value: 'normal' },
          { label: 'High', value: 'high' },
          { label: 'Critical', value: 'critical' },
        ],
      },
    }),
    assignee_user: gorgiasProps.assigneeUserId(false),
    tags: gorgiasProps.tagNames,
  },
  async run(context) {
    const {
      subject,
      customer_email,
      customer_name,
      body_text,
      channel,
      from_agent,
      status,
      priority,
      assignee_user,
      tags,
    } = context.propsValue;

    const response = await gorgiasApi.call<GorgiasTicket>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: '/tickets',
      body: {
        subject,
        channel,
        from_agent: from_agent ?? false,
        status,
        priority,
        customer: { email: customer_email, name: customer_name },
        ...(assignee_user ? { assignee_user: { id: assignee_user } } : {}),
        ...(tags && tags.length > 0 ? { tags: tags.map((name) => ({ name })) } : {}),
        messages: [
          {
            channel,
            from_agent: from_agent ?? false,
            via: channel,
            source: {
              from: { address: from_agent ? undefined : customer_email },
            },
            body_text,
            public: !from_agent,
          },
        ],
      },
    });

    return gorgiasTicket.flattenTicket(response.body);
  },
});
