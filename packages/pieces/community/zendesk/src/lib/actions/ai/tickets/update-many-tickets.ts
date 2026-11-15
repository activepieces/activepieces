import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskCreateManyTicketsOutputSchema } from '../../../output-schemas';

export const zendeskUpdateManyTickets = createAction({
  auth: zendeskAuth,
  name: 'zendesk_update_many_tickets',
  outputSchema: zendeskCreateManyTicketsOutputSchema,
  displayName: 'Update Many Tickets',
  description: 'Apply the same change to up to 100 tickets.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Queues a background job that applies the same field changes to up to 100 tickets and returns the job status. Poll Get Job Status with the returned id for per-ticket results. Additional Tags and Remove Tags change tags without replacing the existing set. Use Update Ticket for a single ticket.',
    idempotent: true,
  },
  props: {
    ticket_ids: Property.Array({
      displayName: 'Ticket IDs',
      description: 'Up to 100 numeric ticket IDs.',
      required: true,
    }),
    status: zendeskAiProps.ticketStatus({ description: 'New status for every ticket.' }),
    priority: zendeskAiProps.ticketPriority(),
    type: zendeskAiProps.ticketType(),
    assignee_id: zendeskAiProps.optionalId({ displayName: 'Assignee ID', description: 'Agent user ID.' }),
    group_id: zendeskAiProps.optionalId({ displayName: 'Group ID', description: 'Group ID, from List Groups.' }),
    organization_id: zendeskAiProps.optionalId({ displayName: 'Organization ID', description: 'Organization ID.' }),
    custom_status_id: zendeskAiProps.optionalId({
      displayName: 'Custom Status ID',
      description: 'Custom status ID, from List Custom Statuses.',
    }),
    additional_tags: Property.Array({ displayName: 'Additional Tags', description: 'Tags to add.', required: false }),
    remove_tags: Property.Array({ displayName: 'Remove Tags', description: 'Tags to remove.', required: false }),
    additional_fields: zendeskAiProps.additionalFields({
      description: 'Other ticket attributes to set on every ticket, e.g. {"custom_fields": [{"id": 123, "value": "x"}]}.',
    }),
  },
  async run({ auth, propsValue }) {
    const p = propsValue;
    const ids = zendeskApi.idList({ values: p.ticket_ids, label: 'Ticket IDs', max: 100 });
    const additionalTags = zendeskApi.stringList(p.additional_tags);
    const removeTags = zendeskApi.stringList(p.remove_tags);
    const ticket = {
      ...zendeskApi.jsonObject({ value: p.additional_fields, label: 'Additional Fields' }),
      ...zendeskApi.compact({
        status: p.status,
        priority: p.priority,
        type: p.type,
        assignee_id: zendeskApi.optionalId({ value: p.assignee_id, label: 'Assignee ID' }),
        group_id: zendeskApi.optionalId({ value: p.group_id, label: 'Group ID' }),
        organization_id: zendeskApi.optionalId({ value: p.organization_id, label: 'Organization ID' }),
        custom_status_id: zendeskApi.optionalId({ value: p.custom_status_id, label: 'Custom Status ID' }),
        additional_tags: additionalTags.length > 0 ? additionalTags : undefined,
        remove_tags: removeTags.length > 0 ? removeTags : undefined,
      }),
    };
    if (Object.keys(ticket).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    const response = await zendeskApi.request<{ job_status: Record<string, unknown> }>({
      auth,
      method: HttpMethod.PUT,
      path: '/tickets/update_many.json',
      queryParams: { ids: ids.join(',') },
      body: { ticket },
    });
    return response.job_status;
  },
});
