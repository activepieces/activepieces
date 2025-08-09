import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { zendeskApiAuth } from '../..';

export const createTicket = createAction({
  auth: zendeskApiAuth,
  name: 'create_ticket',
  displayName: 'Create Ticket',
  description: 'Create a new ticket in Zendesk',
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject of the ticket',
      required: true,
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'The initial comment/description for the ticket',
      required: true,
    }),
    priority: Property.Dropdown({
      displayName: 'Priority',
      description: 'The priority level of the ticket',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Normal', value: 'normal' },
          { label: 'High', value: 'high' },
          { label: 'Urgent', value: 'urgent' },
        ],
      },
    }),
    status: Property.Dropdown({
      displayName: 'Status',
      description: 'The status of the ticket',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Pending', value: 'pending' },
          { label: 'Solved', value: 'solved' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
    type: Property.Dropdown({
      displayName: 'Type',
      description: 'The type of ticket',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Question', value: 'question' },
          { label: 'Incident', value: 'incident' },
          { label: 'Problem', value: 'problem' },
          { label: 'Task', value: 'task' },
        ],
      },
    }),
    requester_id: Property.Number({
      displayName: 'Requester ID',
      description: 'The ID of the user requesting the ticket',
      required: false,
    }),
    assignee_id: Property.Number({
      displayName: 'Assignee ID',
      description: 'The ID of the user assigned to the ticket',
      required: false,
    }),
    organization_id: Property.Number({
      displayName: 'Organization ID',
      description: 'The ID of the organization this ticket belongs to',
      required: false,
    }),
    group_id: Property.Number({
      displayName: 'Group ID',
      description: 'The ID of the group this ticket belongs to',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to apply to the ticket',
      required: false,
      of: Property.ShortText({
        displayName: 'Tag',
        description: 'A tag for the ticket',
        required: true,
      }),
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'An external ID for the ticket',
      required: false,
    }),
    due_at: Property.DateTime({
      displayName: 'Due Date',
      description: 'When the ticket is due',
      required: false,
    }),
    recipient: Property.ShortText({
      displayName: 'Recipient',
      description: 'The recipient email address',
      required: false,
    }),
    html_body: Property.LongText({
      displayName: 'HTML Body',
      description: 'HTML content for the comment (use instead of comment for HTML)',
      required: false,
    }),
    assignee_email: Property.ShortText({
      displayName: 'Assignee Email',
      description: 'Write only. The email address of the agent to assign the ticket to',
      required: false,
    }),
    brand_id: Property.Number({
      displayName: 'Brand ID',
      description: 'The id of the brand this ticket is associated with',
      required: false,
    }),
    collaborator_ids: Property.Array({
      displayName: 'Collaborator IDs',
      description: 'The ids of users currently CC\'ed on the ticket',
      required: false,
      of: Property.Number({
        displayName: 'Collaborator ID',
        description: 'A user ID to CC on the ticket',
        required: true,
      }),
    }),
    custom_fields: Property.Array({
      displayName: 'Custom Fields',
      description: 'Custom fields for the ticket',
      required: false,
      of: Property.Object({
        displayName: 'Custom Field',
        description: 'A custom field value',
        required: true,
        properties: {
          id: Property.Number({
            displayName: 'Field ID',
            description: 'The ID of the custom field',
            required: true,
          }),
          value: Property.ShortText({
            displayName: 'Field Value',
            description: 'The value for the custom field',
            required: true,
          }),
        },
      }),
    }),
    custom_status_id: Property.Number({
      displayName: 'Custom Status ID',
      description: 'The custom ticket status id of the ticket',
      required: false,
    }),
    email_cc_ids: Property.Array({
      displayName: 'Email CC IDs',
      description: 'The ids of agents or end users currently CC\'ed on the ticket',
      required: false,
      of: Property.Number({
        displayName: 'Email CC ID',
        description: 'A user ID to email CC on the ticket',
        required: true,
      }),
    }),
    follower_ids: Property.Array({
      displayName: 'Follower IDs',
      description: 'The ids of agents currently following the ticket',
      required: false,
      of: Property.Number({
        displayName: 'Follower ID',
        description: 'An agent ID to follow the ticket',
        required: true,
      }),
    }),
    problem_id: Property.Number({
      displayName: 'Problem ID',
      description: 'For tickets of type "incident", the ID of the problem the incident is linked to',
      required: false,
    }),
    raw_subject: Property.ShortText({
      displayName: 'Raw Subject',
      description: 'The dynamic content placeholder, if present, or the "subject" value, if not',
      required: false,
    }),
    submitter_id: Property.Number({
      displayName: 'Submitter ID',
      description: 'The user who submitted the ticket',
      required: false,
    }),
    ticket_form_id: Property.Number({
      displayName: 'Ticket Form ID',
      description: 'Enterprise only. The id of the ticket form to render for the ticket',
      required: false,
    }),
    sharing_agreement_ids: Property.Array({
      displayName: 'Sharing Agreement IDs',
      description: 'The ids of the sharing agreements used for this ticket',
      required: false,
      of: Property.Number({
        displayName: 'Sharing Agreement ID',
        description: 'A sharing agreement ID',
        required: true,
      }),
    }),
    macro_id: Property.Number({
      displayName: 'Macro ID',
      description: 'Write only. A macro ID to be recorded in the ticket audit',
      required: false,
    }),
    macro_ids: Property.Array({
      displayName: 'Macro IDs',
      description: 'POST requests only. List of macro IDs to be recorded in the ticket audit',
      required: false,
      of: Property.Number({
        displayName: 'Macro ID',
        description: 'A macro ID for the audit',
        required: true,
      }),
    }),
    attribute_value_ids: Property.Array({
      displayName: 'Attribute Value IDs',
      description: 'Write only. An array of the IDs of attribute values to be associated with the ticket',
      required: false,
      of: Property.Number({
        displayName: 'Attribute Value ID',
        description: 'An attribute value ID',
        required: true,
      }),
    }),
    via_followup_source_id: Property.Number({
      displayName: 'Via Followup Source ID',
      description: 'POST requests only. The id of a closed ticket when creating a follow-up ticket',
      required: false,
    }),
    via_id: Property.Number({
      displayName: 'Via ID',
      description: 'Write only. For more information, see the Via object reference',
      required: false,
    }),
    safe_update: Property.Checkbox({
      displayName: 'Safe Update',
      description: 'Write only. When true, protects against ticket update collisions',
      required: false,
      defaultValue: false,
    }),
    updated_stamp: Property.DateTime({
      displayName: 'Updated Stamp',
      description: 'Write only. Datetime of last update received from API',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { email, token, subdomain } = auth as {
      email: string;
      token: string;
      subdomain: string;
    };

    const ticketData: any = {
      subject: propsValue.subject,
      comment: {
        body: propsValue.comment,
      },
    };

    // Add optional fields if provided
    if (propsValue.priority) ticketData.priority = propsValue.priority;
    if (propsValue.status) ticketData.status = propsValue.status;
    if (propsValue.type) ticketData.type = propsValue.type;
    if (propsValue.requester_id) ticketData.requester_id = propsValue.requester_id;
    if (propsValue.assignee_id) ticketData.assignee_id = propsValue.assignee_id;
    if (propsValue.assignee_email) ticketData.assignee_email = propsValue.assignee_email;
    if (propsValue.organization_id) ticketData.organization_id = propsValue.organization_id;
    if (propsValue.group_id) ticketData.group_id = propsValue.group_id;
    if (propsValue.brand_id) ticketData.brand_id = propsValue.brand_id;
    if (propsValue.tags && propsValue.tags.length > 0) ticketData.tags = propsValue.tags;
    if (propsValue.external_id) ticketData.external_id = propsValue.external_id;
    if (propsValue.due_at) ticketData.due_at = propsValue.due_at;
    if (propsValue.recipient) ticketData.recipient = propsValue.recipient;
    if (propsValue.submitter_id) ticketData.submitter_id = propsValue.submitter_id;
    if (propsValue.problem_id) ticketData.problem_id = propsValue.problem_id;
    if (propsValue.raw_subject) ticketData.raw_subject = propsValue.raw_subject;
    if (propsValue.ticket_form_id) ticketData.ticket_form_id = propsValue.ticket_form_id;
    if (propsValue.custom_status_id) ticketData.custom_status_id = propsValue.custom_status_id;
    if (propsValue.via_followup_source_id) ticketData.via_followup_source_id = propsValue.via_followup_source_id;
    if (propsValue.via_id) ticketData.via_id = propsValue.via_id;
    if (propsValue.macro_id) ticketData.macro_id = propsValue.macro_id;
    if (propsValue.safe_update) ticketData.safe_update = propsValue.safe_update;
    if (propsValue.updated_stamp) ticketData.updated_stamp = propsValue.updated_stamp;

    // Handle arrays
    if (propsValue.collaborator_ids && propsValue.collaborator_ids.length > 0) {
      ticketData.collaborator_ids = propsValue.collaborator_ids;
    }
    if (propsValue.email_cc_ids && propsValue.email_cc_ids.length > 0) {
      ticketData.email_cc_ids = propsValue.email_cc_ids;
    }
    if (propsValue.follower_ids && propsValue.follower_ids.length > 0) {
      ticketData.follower_ids = propsValue.follower_ids;
    }
    if (propsValue.sharing_agreement_ids && propsValue.sharing_agreement_ids.length > 0) {
      ticketData.sharing_agreement_ids = propsValue.sharing_agreement_ids;
    }
    if (propsValue.macro_ids && propsValue.macro_ids.length > 0) {
      ticketData.macro_ids = propsValue.macro_ids;
    }
    if (propsValue.attribute_value_ids && propsValue.attribute_value_ids.length > 0) {
      ticketData.attribute_value_ids = propsValue.attribute_value_ids;
    }

    // Handle custom fields
    if (propsValue.custom_fields && propsValue.custom_fields.length > 0) {
      ticketData.custom_fields = propsValue.custom_fields.map((field: any) => ({
        id: field.id,
        value: field.value,
      }));
    }

    // Handle HTML body if provided
    if (propsValue.html_body) {
      ticketData.comment.html_body = propsValue.html_body;
    }

    const response = await httpClient.sendRequest({
      url: `https://${subdomain}.zendesk.com/api/v2/tickets.json`,
      method: HttpMethod.POST,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${email}/token:${token}`).toString('base64')}`,
      },
      body: {
        ticket: ticketData,
      },
    });

    return response.body;
  },
}); 