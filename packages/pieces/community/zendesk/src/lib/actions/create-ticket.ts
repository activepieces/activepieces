import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';
import { organizationIdDropdown, brandIdDropdown, problemTicketIdDropdown, groupIdDropdown } from '../common/props';

type AuthProps = {
  email: string;
  token: string;
  subdomain: string;
};

export const createTicketAction = createAction({
  auth: zendeskAuth,
  name: 'create-ticket',
  displayName: 'Create Ticket',
  description: 'Create a new ticket in Zendesk.',
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject of the ticket',
      required: true,
    }),
    comment_body: Property.LongText({
      displayName: 'Comment Body',
      description: 'The comment body (text). Use this for plain text comments.',
      required: false,
    }),
    comment_html_body: Property.LongText({
      displayName: 'Comment HTML Body',
      description: 'The comment body (HTML). Use this for HTML formatted comments. If provided, this takes precedence over Comment Body.',
      required: false,
    }),
    requester_email: Property.ShortText({
      displayName: 'Requester Email',
      description: 'Email address of the ticket requester. If not provided, the authenticated user will be the requester.',
      required: false,
    }),
    requester_name: Property.ShortText({
      displayName: 'Requester Name',
      description: 'Name of the ticket requester (used when creating a new user).',
      required: false,
    }),
    assignee_email: Property.ShortText({
      displayName: 'Assignee Email',
      description: 'Email address of the agent to assign the ticket to.',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'The priority of the ticket.',
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
      description: 'The type of ticket.',
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
      description: 'The status of the ticket.',
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
      description: 'Array of tags to apply to the ticket.',
      required: false,
    }),
    organization_id: organizationIdDropdown,
    group_id: groupIdDropdown,
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'An external ID for the ticket (useful for integrations).',
      required: false,
    }),
    collaborator_emails: Property.Array({
      displayName: 'Collaborator Emails',
      description: 'Array of email addresses to add as collaborators.',
      required: false,
    }),
    follower_emails: Property.Array({
      displayName: 'Follower Emails', 
      description: 'Array of email addresses to add as followers.',
      required: false,
    }),
    due_at: Property.DateTime({
      displayName: 'Due Date',
      description: 'The date and time when the ticket is due.',
      required: false,
    }),
    custom_fields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Custom field values as JSON object. Example: {"field_id": "value"}',
      required: false,
    }),
    comment_public: Property.Checkbox({
      displayName: 'Public Comment',
      description: 'Whether the comment is public (visible to the requester). Defaults to true.',
      required: false,
    }),
    brand_id: brandIdDropdown,
    forum_topic_id: Property.Number({
      displayName: 'Forum Topic ID',
      description: 'The ID of the forum topic associated with the ticket.',
      required: false,
    }),
    problem_id: problemTicketIdDropdown,
  },
  async run({ propsValue, auth }) {
    const authentication = auth as AuthProps;
    const {
      subject,
      comment_body,
      comment_html_body,
      requester_email,
      requester_name,
      assignee_email,
      priority,
      type,
      status,
      tags,
      organization_id,
      group_id,
      external_id,
      collaborator_emails,
      follower_emails,
      due_at,
      custom_fields,
      comment_public,
      brand_id,
      forum_topic_id,
      problem_id,
    } = propsValue;

    if (!comment_body && !comment_html_body) {
      throw new Error('Either Comment Body or Comment HTML Body is required');
    }

    const comment: Record<string, unknown> = {};
    if (comment_html_body) {
      comment.html_body = comment_html_body;
    } else if (comment_body) {
      comment.body = comment_body;
    }

    if (comment_public !== undefined) {
      comment.public = comment_public;
    }

    const ticket: Record<string, unknown> = {
      subject,
      comment,
    };

    const resolveUserByEmail = async (email: string) => {
      try {
        const response = await httpClient.sendRequest({
          url: `https://${authentication.subdomain}.zendesk.com/api/v2/users/search.json?query=email:${encodeURIComponent(email)}`,
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
        console.warn(`Warning: Could not resolve user with email ${email}:`, (error as Error).message);
        return null;
      }
    };

    if (requester_email) {
      const requesterId = await resolveUserByEmail(requester_email);
      if (requesterId) {
        ticket.requester_id = requesterId;
      } else {
        ticket.requester = {
          email: requester_email,
          name: requester_name || requester_email,
        };
      }
    }

    if (assignee_email) {
      const assigneeId = await resolveUserByEmail(assignee_email);
      if (assigneeId) {
        ticket.assignee_id = assigneeId;
      } else {
        throw new Error(`Could not find agent with email: ${assignee_email}`);
      }
    }

    if (collaborator_emails && Array.isArray(collaborator_emails) && collaborator_emails.length > 0) {
      const collaboratorIds = [];
      for (const email of collaborator_emails) {
        const collaboratorId = await resolveUserByEmail(email as string);
        if (collaboratorId) {
          collaboratorIds.push(collaboratorId);
        }
      }
      if (collaboratorIds.length > 0) {
        ticket.collaborator_ids = collaboratorIds;
      }
    }

    if (follower_emails && Array.isArray(follower_emails) && follower_emails.length > 0) {
      const followerIds = [];
      for (const email of follower_emails) {
        const followerId = await resolveUserByEmail(email as string);
        if (followerId) {
          followerIds.push(followerId);
        }
      }
      if (followerIds.length > 0) {
        ticket.follower_ids = followerIds;
      }
    }

    const optionalParams = {
      priority,
      type,
      status,
      tags,
      organization_id,
      group_id,
      external_id,
      due_at,
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
        const customFieldsObj = typeof custom_fields === 'string' ? JSON.parse(custom_fields) : custom_fields;
        const customFieldsArray = Object.entries(customFieldsObj).map(([id, value]) => ({
          id: parseInt(id),
          value,
        }));
        ticket.custom_fields = customFieldsArray;
      } catch (error) {
        throw new Error('Invalid custom fields format. Expected JSON object with field IDs as keys.');
      }
    }

    try {
      const response = await httpClient.sendRequest({
        url: `https://${authentication.subdomain}.zendesk.com/api/v2/tickets.json`,
        method: HttpMethod.POST,
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
        message: 'Ticket created successfully',
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
      
      if (errorMessage.includes('422')) {
        throw new Error(
          'Validation error. Please check that all required fields are provided and valid.'
        );
      }
      
      if (errorMessage.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to create ticket: ${errorMessage}`);
    }
  },
});
