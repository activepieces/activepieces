import { HttpMethod } from '@activepieces/pieces-common';
import { gorgiasApi, GorgiasAuth } from './client';

const TICKET_FORM = {
  id: '{{ticket.id}}',
  subject: '{{ticket.subject}}',
  status: '{{ticket.status}}',
  priority: '{{ticket.priority}}',
  channel: '{{ticket.channel}}',
  via: '{{ticket.via}}',
  language: '{{ticket.language}}',
  customer_id: '{{ticket.customer.id}}',
  customer_email: '{{ticket.customer.email}}',
  customer_name: '{{ticket.customer.name}}',
  assignee_user_id: '{{ticket.assignee_user.id}}',
  assignee_user_email: '{{ticket.assignee_user.email}}',
  created_datetime: '{{ticket.created_datetime}}',
  updated_datetime: '{{ticket.updated_datetime}}',
};

const MESSAGE_FORM = {
  ...TICKET_FORM,
  message_id: '{{message.id}}',
  message_body_text: '{{message.body_text}}',
  message_from_agent: '{{message.from_agent}}',
  message_channel: '{{message.channel}}',
  message_public: '{{message.public}}',
  message_created_datetime: '{{message.created_datetime}}',
};

async function register({
  auth,
  webhookUrl,
  event,
  withMessageFields,
}: {
  auth: GorgiasAuth;
  webhookUrl: string;
  event: string;
  withMessageFields: boolean;
}): Promise<number> {
  const response = await gorgiasApi.call<{ id: number }>({
    auth,
    method: HttpMethod.POST,
    path: '/integrations',
    body: {
      name: `Activepieces - ${event}`,
      type: 'http',
      http: {
        url: webhookUrl,
        method: 'POST',
        request_content_type: 'application/json',
        response_content_type: 'application/json',
        triggers: { [event]: true },
        form: withMessageFields ? MESSAGE_FORM : TICKET_FORM,
      },
    },
  });
  return response.body.id;
}

async function unregister({
  auth,
  integrationId,
}: {
  auth: GorgiasAuth;
  integrationId: number;
}): Promise<void> {
  await gorgiasApi.call({
    auth,
    method: HttpMethod.DELETE,
    path: `/integrations/${integrationId}`,
  });
}

export const gorgiasWebhooks = { register, unregister };
