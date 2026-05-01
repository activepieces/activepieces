import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { freshserviceApiCall } from '../common/client';
import { freshserviceCommon } from '../common/props';

export const updateTicket = createAction({
  auth: freshserviceAuth,
  name: 'update_ticket',
  displayName: 'Update Ticket',
  description: 'Updates an existing ticket in Freshservice.',
  props: {
    ticket_id: freshserviceCommon.ticket(true),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The new subject of the ticket.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'HTML content of the ticket.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 2 },
          { label: 'Pending', value: 3 },
          { label: 'Resolved', value: 4 },
          { label: 'Closed', value: 5 },
        ],
      },
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      required: false,
      options: {
        options: [
          { label: 'Low', value: 1 },
          { label: 'Medium', value: 2 },
          { label: 'High', value: 3 },
          { label: 'Urgent', value: 4 },
        ],
      },
    }),
    responder_id: freshserviceCommon.agent(false),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to set on the ticket.',
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

    const body: Record<string, unknown> = {};

    if (props.subject) body['subject'] = props.subject;
    if (props.description) body['description'] = props.description;
    if (props.status) body['status'] = props.status;
    if (props.priority) body['priority'] = props.priority;
    if (props.responder_id) body['responder_id'] = props.responder_id;
    if (props.tags && props.tags.length > 0) body['tags'] = props.tags;
    if (props.custom_fields) body['custom_fields'] = props.custom_fields;

    const response = await freshserviceApiCall<{ ticket: Record<string, unknown> }>({
      method: HttpMethod.PUT,
      endpoint: `tickets/${props.ticket_id}`,
      auth: context.auth,
      body,
    });

    return response.body.ticket;
  },
});
