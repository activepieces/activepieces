import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { freshserviceApiCall } from '../common/client';
import { freshserviceCommon } from '../common/props';

export const createTicket = createAction({
  auth: freshserviceAuth,
  name: 'create_ticket',
  displayName: 'Create Ticket',
  description: 'Creates a new ticket in Freshservice.',
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject of the ticket.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'HTML content of the ticket. You can use basic HTML tags for formatting.',
      required: true,
    }),
    requester_id: freshserviceCommon.requester(true),
    status: freshserviceCommon.status,
    priority: freshserviceCommon.priority,
    source: freshserviceCommon.source,
    urgency: freshserviceCommon.urgency,
    impact: freshserviceCommon.impact,
    type: Property.ShortText({
      displayName: 'Type',
      description: 'The type of ticket (e.g., Incident, Service Request).',
      required: false,
    }),
    responder_id: freshserviceCommon.agent(false),
    department_id: freshserviceCommon.department(false),
    group_id: freshserviceCommon.group(false),
    category: Property.ShortText({
      displayName: 'Category',
      description: 'The category of the ticket.',
      required: false,
    }),
    sub_category: Property.ShortText({
      displayName: 'Sub Category',
      description: 'The sub-category of the ticket.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to add to the ticket.',
      required: false,
    }),
    custom_fields: Property.Json({
      displayName: 'Custom Fields',
      description: 'A JSON object of custom field names and values.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;

    const ticketBody: Record<string, unknown> = {
      subject: props.subject,
      description: props.description,
      requester_id: props.requester_id,
    };

    if (props.status) ticketBody['status'] = props.status;
    if (props.priority) ticketBody['priority'] = props.priority;
    if (props.source) ticketBody['source'] = props.source;
    if (props.urgency) ticketBody['urgency'] = props.urgency;
    if (props.impact) ticketBody['impact'] = props.impact;
    if (props.type) ticketBody['type'] = props.type;
    if (props.responder_id) ticketBody['responder_id'] = props.responder_id;
    if (props.department_id) ticketBody['department_id'] = props.department_id;
    if (props.group_id) ticketBody['group_id'] = props.group_id;
    if (props.category) ticketBody['category'] = props.category;
    if (props.sub_category) ticketBody['sub_category'] = props.sub_category;
    if (props.tags && props.tags.length > 0) ticketBody['tags'] = props.tags;
    if (props.custom_fields) ticketBody['custom_fields'] = props.custom_fields;

    const response = await freshserviceApiCall<{ ticket: Record<string, unknown> }>({
      method: HttpMethod.POST,
      endpoint: 'tickets',
      auth: context.auth,
      body: ticketBody,
    });

    return response.body.ticket;
  },
});
