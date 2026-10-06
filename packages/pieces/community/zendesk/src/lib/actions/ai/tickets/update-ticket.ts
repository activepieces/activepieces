import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskCreateTicketOutputSchema } from '../../../output-schemas';

export const zendeskUpdateTicket = createAction({
  auth: zendeskAuth,
  name: 'zendesk_update_ticket',
  outputSchema: zendeskCreateTicketOutputSchema,
  displayName: 'Update Ticket',
  description: 'Change fields on an existing ticket.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates fields on one ticket; omitted fields keep their values. Use Add Ticket Comment to reply, Add Ticket Tags or Remove Ticket Tags to change tags without replacing them (Tags here replaces the whole set), and Update Many Tickets for bulk changes. To clear a field such as the assignee, pass {"assignee_id": null} in Additional Fields. Pass Updated Stamp (the ticket updated_at) to fail with 409 instead of overwriting a concurrent change.',
    idempotent: true,
  },
  props: {
    ticket_id: zendeskAiProps.ticketId(),
    subject: Property.ShortText({ displayName: 'Subject', required: false }),
    status: zendeskAiProps.ticketStatus({ description: 'New status. closed is final and cannot be reopened.' }),
    priority: zendeskAiProps.ticketPriority(),
    type: zendeskAiProps.ticketType(),
    assignee_id: zendeskAiProps.optionalId({
      displayName: 'Assignee ID',
      description: 'Agent user ID, from List Users with role agent or List Group Users.',
    }),
    group_id: zendeskAiProps.optionalId({ displayName: 'Group ID', description: 'Group ID, from List Groups.' }),
    organization_id: zendeskAiProps.optionalId({
      displayName: 'Organization ID',
      description: 'Organization ID, from Search Organizations.',
    }),
    requester_id: zendeskAiProps.optionalId({ displayName: 'Requester ID', description: 'User ID, from Search Users.' }),
    problem_id: zendeskAiProps.optionalId({
      displayName: 'Problem ID',
      description: 'For type incident: the problem ticket ID, from List Problem Tickets.',
    }),
    custom_status_id: zendeskAiProps.optionalId({
      displayName: 'Custom Status ID',
      description: 'Custom status ID, from List Custom Statuses.',
    }),
    brand_id: zendeskAiProps.optionalId({ displayName: 'Brand ID', description: 'Brand ID, from List Brands.' }),
    due_at: Property.DateTime({ displayName: 'Due At', description: 'Due date, only valid for type task.', required: false }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Replaces every tag on the ticket; an empty list is ignored. Prefer Add Ticket Tags or Remove Ticket Tags, which also clear tags.',
      required: false,
    }),
    external_id: Property.ShortText({ displayName: 'External ID', required: false }),
    custom_fields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Array of {"id": <ticket field ID from List Ticket Fields>, "value": <value>}. Only listed fields change.',
      required: false,
    }),
    additional_fields: zendeskAiProps.additionalFields({
      description: 'Other ticket attributes from the Zendesk Tickets API, or null values to clear fields, e.g. {"assignee_id": null}.',
    }),
    updated_stamp: Property.ShortText({
      displayName: 'Updated Stamp',
      description: 'The updated_at value read from Get Ticket; enables safe update so a concurrent change returns 409.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const p = propsValue;
    const ticketId = zendeskApi.id({ value: p.ticket_id, label: 'Ticket ID' });
    const tags = zendeskApi.stringList(p.tags);
    const ticket = {
      ...zendeskApi.jsonObject({ value: p.additional_fields, label: 'Additional Fields' }),
      ...zendeskApi.compact({
        subject: p.subject,
        status: p.status,
        priority: p.priority,
        type: p.type,
        assignee_id: zendeskApi.optionalId({ value: p.assignee_id, label: 'Assignee ID' }),
        group_id: zendeskApi.optionalId({ value: p.group_id, label: 'Group ID' }),
        organization_id: zendeskApi.optionalId({ value: p.organization_id, label: 'Organization ID' }),
        requester_id: zendeskApi.optionalId({ value: p.requester_id, label: 'Requester ID' }),
        problem_id: zendeskApi.optionalId({ value: p.problem_id, label: 'Problem ID' }),
        custom_status_id: zendeskApi.optionalId({ value: p.custom_status_id, label: 'Custom Status ID' }),
        brand_id: zendeskApi.optionalId({ value: p.brand_id, label: 'Brand ID' }),
        due_at: p.due_at,
        tags: tags.length > 0 ? tags : undefined,
        external_id: p.external_id,
        custom_fields: zendeskApi.jsonArray({ value: p.custom_fields, label: 'Custom Fields' }),
      }),
    };
    if (Object.keys(ticket).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    const response = await zendeskApi.request<{ ticket: Record<string, unknown> }>({
      auth,
      method: HttpMethod.PUT,
      path: `/tickets/${ticketId}.json`,
      body: {
        ticket: {
          ...ticket,
          ...(p.updated_stamp ? { safe_update: true, updated_stamp: p.updated_stamp } : {}),
        },
      },
    });
    return response.ticket;
  },
});
