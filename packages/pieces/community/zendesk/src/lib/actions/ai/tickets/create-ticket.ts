import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskCreateTicketOutputSchema } from '../../../output-schemas';

export const zendeskCreateTicket = createAction({
  auth: zendeskAuth,
  name: 'zendesk_create_ticket',
  outputSchema: zendeskCreateTicketOutputSchema,
  displayName: 'Create Ticket',
  description: 'Create a support ticket with a first comment.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates one Zendesk ticket whose first comment becomes its description. Identify the requester by Requester ID (from Search Users) or by Requester Email, which Zendesk creates as a new end user when no user has that email. Use Create Many Tickets for bulk creation. Not idempotent: each call creates a new ticket, so pass External ID and check with List Tickets before retrying.',
    idempotent: false,
  },
  props: {
    comment_body: Property.LongText({
      displayName: 'Comment Body',
      description: 'The first comment, which becomes the ticket description.',
      required: true,
    }),
    comment_is_html: Property.Checkbox({
      displayName: 'Comment Is HTML',
      description: 'Send Comment Body as HTML instead of plain text.',
      required: false,
    }),
    comment_public: zendeskAiProps.optionalBoolean({
      displayName: 'Public Comment',
      description: 'Whether the requester can see the first comment. Defaults to public.',
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: false,
    }),
    requester_id: zendeskAiProps.optionalId({
      displayName: 'Requester ID',
      description: 'User ID of the requester, from Search Users. Do not combine with Requester Email.',
    }),
    requester_email: Property.ShortText({
      displayName: 'Requester Email',
      description: 'Email of the requester; Zendesk creates the end user if none exists. Do not combine with Requester ID.',
      required: false,
    }),
    requester_name: Property.ShortText({
      displayName: 'Requester Name',
      description: 'Name used when Requester Email creates a new end user.',
      required: false,
    }),
    assignee_id: zendeskAiProps.optionalId({
      displayName: 'Assignee ID',
      description: 'Agent user ID, from List Users with role agent or List Group Users.',
    }),
    group_id: zendeskAiProps.optionalId({
      displayName: 'Group ID',
      description: 'Group ID, from List Groups.',
    }),
    organization_id: zendeskAiProps.optionalId({
      displayName: 'Organization ID',
      description: 'Organization ID, from Search Organizations.',
    }),
    status: zendeskAiProps.ticketStatus({ description: 'Initial status. Defaults to new, or open when an assignee is set.' }),
    priority: zendeskAiProps.ticketPriority(),
    type: zendeskAiProps.ticketType(),
    problem_id: zendeskAiProps.optionalId({
      displayName: 'Problem ID',
      description: 'For type incident: the problem ticket ID, from List Problem Tickets.',
    }),
    due_at: Property.DateTime({
      displayName: 'Due At',
      description: 'Due date, only valid for type task.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'Your own reference for the ticket, searchable with List Tickets.',
      required: false,
    }),
    brand_id: zendeskAiProps.optionalId({
      displayName: 'Brand ID',
      description: 'Brand ID, from List Brands.',
    }),
    ticket_form_id: zendeskAiProps.optionalId({
      displayName: 'Ticket Form ID',
      description: 'Ticket form ID, from List Ticket Forms.',
    }),
    custom_fields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Array of {"id": <ticket field ID from List Ticket Fields>, "value": <value>}.',
      required: false,
    }),
    additional_fields: zendeskAiProps.additionalFields({
      description: 'Other ticket attributes from the Zendesk Tickets API, e.g. {"email_ccs": [{"user_email": "a@b.com"}]}.',
    }),
  },
  async run({ auth, propsValue }) {
    const p = propsValue;
    if (p.requester_id && p.requester_email) {
      throw new Error('Pass either Requester ID or Requester Email, not both.');
    }
    const tags = zendeskApi.stringList(p.tags);
    const ticket = {
      ...zendeskApi.jsonObject({ value: p.additional_fields, label: 'Additional Fields' }),
      ...zendeskApi.compact({
        subject: p.subject,
        comment: zendeskApi.compact({
          [p.comment_is_html ? 'html_body' : 'body']: p.comment_body,
          public: zendeskApi.optionalBoolean(p.comment_public),
        }),
        requester_id: zendeskApi.optionalId({ value: p.requester_id, label: 'Requester ID' }),
        requester: p.requester_email ? zendeskApi.compact({ email: p.requester_email, name: p.requester_name }) : undefined,
        assignee_id: zendeskApi.optionalId({ value: p.assignee_id, label: 'Assignee ID' }),
        group_id: zendeskApi.optionalId({ value: p.group_id, label: 'Group ID' }),
        organization_id: zendeskApi.optionalId({ value: p.organization_id, label: 'Organization ID' }),
        status: p.status,
        priority: p.priority,
        type: p.type,
        problem_id: zendeskApi.optionalId({ value: p.problem_id, label: 'Problem ID' }),
        due_at: p.due_at,
        tags: tags.length > 0 ? tags : undefined,
        external_id: p.external_id,
        brand_id: zendeskApi.optionalId({ value: p.brand_id, label: 'Brand ID' }),
        ticket_form_id: zendeskApi.optionalId({ value: p.ticket_form_id, label: 'Ticket Form ID' }),
        custom_fields: zendeskApi.jsonArray({ value: p.custom_fields, label: 'Custom Fields' }),
      }),
    };
    const response = await zendeskApi.request<{ ticket: Record<string, unknown> }>({
      auth,
      method: HttpMethod.POST,
      path: '/tickets.json',
      body: { ticket },
    });
    return response.ticket;
  },
});
