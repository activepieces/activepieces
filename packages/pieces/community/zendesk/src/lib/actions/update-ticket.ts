import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../index';
import { makeZendeskRequest, validateZendeskAuth, ZENDESK_ERRORS } from '../common/utils';
import { ZendeskAuthProps, ZendeskTicket } from '../common/types';
import { sampleTicket } from '../common/sample-data';

export const updateTicket = createAction({
  auth: zendeskAuth,
  name: 'update_ticket',
  displayName: 'Update Ticket',
  description: 'Update an existing ticket in Zendesk',
  props: {
    ticket_id: Property.Number({
      displayName: 'Ticket ID',
      description: 'The ID of the ticket to update',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Update the subject of the ticket',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Update the status of the ticket',
      required: false,
      options: {
        placeholder: 'Select status',
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
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Update the type of ticket',
      required: false,
      options: {
        placeholder: 'Select ticket type',
        options: [
          { label: 'Question', value: 'question' },
          { label: 'Incident', value: 'incident' },
          { label: 'Problem', value: 'problem' },
          { label: 'Task', value: 'task' },
        ],
      },
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'Update the priority of the ticket',
      required: false,
      options: {
        placeholder: 'Select priority',
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Normal', value: 'normal' },
          { label: 'High', value: 'high' },
          { label: 'Urgent', value: 'urgent' },
        ],
      },
    }),
    assignee_email: Property.ShortText({
      displayName: 'Assignee Email',
      description: 'Email of the user to assign the ticket to',
      required: false,
    }),
    group_id: Property.Number({
      displayName: 'Group ID',
      description: 'The ID of the group to assign the ticket to',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Comma-separated list of tags to replace existing tags',
      required: false,
    }),
  },
  sampleData: sampleTicket,
  async run(context) {
    const { auth, propsValue } = context;

    if (!validateZendeskAuth(auth)) {
      throw new Error(ZENDESK_ERRORS.INVALID_AUTH);
    }

    const authentication = auth as ZendeskAuthProps;
    
    // Build update data object with only provided fields
    const updateData: any = {
      ticket: {},
    };

    if (propsValue.subject) updateData.ticket.subject = propsValue.subject;
    if (propsValue.status) updateData.ticket.status = propsValue.status;
    if (propsValue.type) updateData.ticket.type = propsValue.type;
    if (propsValue.priority) updateData.ticket.priority = propsValue.priority;
    if (propsValue.group_id) updateData.ticket.group_id = propsValue.group_id;
    
    // Process tags
    if (propsValue.tags) {
      const tags = propsValue.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      if (tags.length > 0) {
        updateData.ticket.tags = tags;
      }
    }

    // Handle assignee email lookup
    if (propsValue.assignee_email) {
      try {
        // Find the user by email to get their ID
        const users = await makeZendeskRequest<{ users: any[] }>(
          authentication,
          `/search.json?query=type:user email:${propsValue.assignee_email}`
        );
        
        if (users.users && users.users.length > 0) {
          updateData.ticket.assignee_id = users.users[0].id;
        } else {
          throw new Error(`User with email ${propsValue.assignee_email} not found`);
        }
      } catch (error: any) {
        throw new Error(`Failed to find assignee user: ${error.message}`);
      }
    }

    // Check if we have anything to update
    if (Object.keys(updateData.ticket).length === 0) {
      throw new Error('No fields provided to update');
    }

    try {
      const response = await makeZendeskRequest<{ ticket: ZendeskTicket }>(
        authentication,
        `/tickets/${propsValue.ticket_id}.json`,
        HttpMethod.PUT,
        updateData
      );

      return response.ticket;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error(ZENDESK_ERRORS.UNAUTHORIZED);
      } else if (error.response?.status === 404) {
        throw new Error('Ticket not found');
      } else if (error.response?.status === 429) {
        throw new Error(ZENDESK_ERRORS.RATE_LIMITED);
      } else if (error.response?.status >= 500) {
        throw new Error(ZENDESK_ERRORS.SERVER_ERROR);
      }
      
      throw new Error(`Failed to update ticket: ${error.message}`);
    }
  },
});