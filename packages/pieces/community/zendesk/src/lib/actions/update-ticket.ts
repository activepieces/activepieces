import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';
import {
  organizationIdDropdown,
  ticketIdDropdown,
  groupIdDropdown,
} from '../common/props';

type AuthProps = {
  email: string;
  token: string;
  subdomain: string;
};

export const updateTicketAction = createAction({
  auth: zendeskAuth,
  name: 'update-ticket',
  displayName: 'Update Ticket',
  description: 'Modify ticket fields or status via API call.',
  props: {
    ticket_id: ticketIdDropdown,
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Update the subject of the ticket',
      required: false,
    }),
    comment_body: Property.LongText({
      displayName: 'Comment Body',
      description: 'Add a comment to the ticket (plain text)',
      required: false,
    }),
    comment_html_body: Property.LongText({
      displayName: 'Comment HTML Body',
      description:
        'Add a comment to the ticket (HTML). If provided, this takes precedence over Comment Body.',
      required: false,
    }),
    comment_public: Property.Checkbox({
      displayName: 'Public Comment',
      description:
        'Whether the comment is public (visible to the requester). Defaults to true.',
      required: false,
    }),
    assignee_email: Property.ShortText({
      displayName: 'Assignee Email',
      description: 'Email address of the agent to assign the ticket to',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'Update the priority of the ticket',
      required: false,
      options: {
        disabled: false,
        placeholder: 'Select priority (optional)',
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Normal', value: 'normal' },
          { label: 'High', value: 'high' },
          { label: 'Urgent', value: 'urgent' },
        ],
      },
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Update the type of ticket',
      required: false,
      options: {
        disabled: false,
        placeholder: 'Select type (optional)',
        options: [
          { label: 'Problem', value: 'problem' },
          { label: 'Incident', value: 'incident' },
          { label: 'Question', value: 'question' },
          { label: 'Task', value: 'task' },
        ],
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Update the status of the ticket',
      required: false,
      options: {
        disabled: false,
        placeholder: 'Select status (optional)',
        options: [
          { label: 'New', value: 'new' },
          { label: 'Open', value: 'open' },
          { label: 'Pending', value: 'pending' },
          { label: 'Hold', value: 'hold' },
          { label: 'Solved', value: 'solved' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description:
        'Replace all tags with this array. Use "Add Tag to Ticket" action to add tags without replacing existing ones.',
      required: false,
    }),
    organization_id: organizationIdDropdown,
    group_id: groupIdDropdown,
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'Update the external ID for the ticket',
      required: false,
    }),
    due_at: Property.DateTime({
      displayName: 'Due Date',
      description: 'Update the date and time when the ticket is due',
      required: false,
    }),
    custom_fields: Property.Json({
      displayName: 'Custom Fields',
      description:
        'Update custom field values as JSON object. Example: {"field_id": "value"}',
      required: false,
    }),
    custom_status_id: Property.Number({
      displayName: 'Custom Status ID',
      description: 'Set a custom status ID for the ticket',
      required: false,
    }),
    brand_id: Property.Number({
      displayName: 'Brand ID',
      description: 'Update the brand associated with the ticket',
      required: false,
    }),
    forum_topic_id: Property.Number({
      displayName: 'Forum Topic ID',
      description: 'Update the forum topic associated with the ticket',
      required: false,
    }),
    problem_id: Property.Number({
      displayName: 'Problem ID',
      description: 'Update the problem ticket this ticket is an incident of',
      required: false,
    }),
    collaborator_emails: Property.Array({
      displayName: 'Collaborator Emails',
      description: 'Replace collaborators with this array of email addresses',
      required: false,
    }),
    follower_emails: Property.Array({
      displayName: 'Follower Emails',
      description: 'Replace followers with this array of email addresses',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const authentication = auth as AuthProps;
    const {
      ticket_id,
      subject,
      comment_body,
      comment_html_body,
      comment_public,
      assignee_email,
      priority,
      type,
      status,
      tags,
      organization_id,
      group_id,
      external_id,
      due_at,
      custom_fields,
      custom_status_id,
      brand_id,
      forum_topic_id,
      problem_id,
      collaborator_emails,
      follower_emails,
    } = propsValue;

    const resolveUserByEmail = async (email: string) => {
      try {
        const response = await httpClient.sendRequest({
          url: `https://${
            authentication.subdomain
          }.zendesk.com/api/v2/users/search.json?query=email:${encodeURIComponent(
            email
          )}`,
          method: HttpMethod.GET,
          authentication: {
            type: AuthenticationType.BASIC,
            username: authentication.email + '/token',
            password: authentication.token,
          },
        });

        const users = (response.body as { users: Array<{ id: number }> }).users;
        return users.length > 0 ? users[0].id : null;
      } catch (error) {
        console.warn(
          `Warning: Could not resolve user with email ${email}:`,
          (error as Error).message
        );
        return null;
      }
    };

    const ticket: Record<string, unknown> = {};

    if (comment_body || comment_html_body) {
      const comment: Record<string, unknown> = {};
      if (comment_html_body) {
        comment.html_body = comment_html_body;
      } else if (comment_body) {
        comment.body = comment_body;
      }

      if (comment_public !== undefined) {
        comment.public = comment_public;
      }

      ticket.comment = comment;
    }

    if (assignee_email) {
      const assigneeId = await resolveUserByEmail(assignee_email);
      if (assigneeId) {
        ticket.assignee_id = assigneeId;
      } else {
        throw new Error(`Could not find agent with email: ${assignee_email}`);
      }
    }

    if (
      collaborator_emails &&
      Array.isArray(collaborator_emails) &&
      collaborator_emails.length > 0
    ) {
      const collaboratorIds = [];
      for (const email of collaborator_emails) {
        const collaboratorId = await resolveUserByEmail(email as string);
        if (collaboratorId) {
          collaboratorIds.push(collaboratorId);
        }
      }
      ticket.collaborator_ids = collaboratorIds;
    }

    if (
      follower_emails &&
      Array.isArray(follower_emails) &&
      follower_emails.length > 0
    ) {
      const followerIds = [];
      for (const email of follower_emails) {
        const followerId = await resolveUserByEmail(email as string);
        if (followerId) {
          followerIds.push(followerId);
        }
      }
      ticket.follower_ids = followerIds;
    }

    const optionalParams = {
      subject,
      priority,
      type,
      status,
      tags,
      organization_id,
      group_id,
      external_id,
      due_at,
      custom_status_id,
      brand_id,
      forum_topic_id,
      problem_id,
    };

    for (const [key, value] of Object.entries(optionalParams)) {
      if (value !== null && value !== undefined && value !== '') {
        ticket[key] = value;
      }
    }

    if (custom_fields) {
      try {
        const customFieldsObj =
          typeof custom_fields === 'string'
            ? JSON.parse(custom_fields)
            : custom_fields;
        const customFieldsArray = Object.entries(customFieldsObj).map(
          ([id, value]) => ({
            id: parseInt(id),
            value,
          })
        );
        ticket.custom_fields = customFieldsArray;
      } catch (error) {
        throw new Error(
          'Invalid custom fields format. Expected JSON object with field IDs as keys.'
        );
      }
    }

    if (Object.keys(ticket).length === 0) {
      throw new Error(
        'No fields provided to update. Please specify at least one field to modify.'
      );
    }

    try {
      const response = await httpClient.sendRequest({
        url: `https://${authentication.subdomain}.zendesk.com/api/v2/tickets/${ticket_id}.json`,
        method: HttpMethod.PUT,
        headers: {
          'Content-Type': 'application/json',
        },
        authentication: {
          type: AuthenticationType.BASIC,
          username: authentication.email + '/token',
          password: authentication.token,
        },
        body: {
          ticket,
        },
      });

      return {
        success: true,
        message: 'Ticket updated successfully',
        data: response.body,
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('400')) {
        throw new Error(
          'Invalid request parameters. Please check your input values and try again.'
        );
      }

      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        throw new Error(
          'Authentication failed. Please check your API credentials and permissions.'
        );
      }

      if (errorMessage.includes('404')) {
        throw new Error(
          `Ticket with ID ${ticket_id} not found. Please verify the ticket ID.`
        );
      }

      if (errorMessage.includes('422')) {
        throw new Error(
          'Validation error. Please check that all field values are valid.'
        );
      }

      if (errorMessage.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to update ticket: ${errorMessage}`);
    }
  },
});
