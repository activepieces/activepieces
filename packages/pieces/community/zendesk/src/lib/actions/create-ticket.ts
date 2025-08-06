import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../index';
import { makeZendeskRequest, validateZendeskAuth, ZENDESK_ERRORS } from '../common/utils';
import { ZendeskAuthProps, ZendeskTicket } from '../common/types';
import { sampleTicket } from '../common/sample-data';

export const createTicket = createAction({
  auth: zendeskAuth,
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
      description: 'The initial comment for the ticket',
      required: true,
    }),
    requester_email: Property.ShortText({
      displayName: 'Requester Email',
      description: 'Email address of the ticket requester',
      required: false,
    }),
    requester_name: Property.ShortText({
      displayName: 'Requester Name',
      description: 'Name of the ticket requester',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'The type of ticket',
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
      description: 'The priority of the ticket',
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
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Comma-separated list of tags to add to the ticket',
      required: false,
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
  },
  sampleData: sampleTicket,
  async run(context) {
    const { auth, propsValue } = context;

    if (!validateZendeskAuth(auth)) {
      throw new Error(ZENDESK_ERRORS.INVALID_AUTH);
    }

    const authentication = auth as ZendeskAuthProps;
    
    // Process tags
    const tags = propsValue.tags ? 
      propsValue.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : 
      [];

    const ticketData: any = {
      ticket: {
        subject: propsValue.subject,
        comment: {
          body: propsValue.comment,
        },
        ...(propsValue.type && { type: propsValue.type }),
        ...(propsValue.priority && { priority: propsValue.priority }),
        ...(tags.length > 0 && { tags }),
        ...(propsValue.group_id && { group_id: propsValue.group_id }),
      },
    };

    // Set requester information
    if (propsValue.requester_email) {
      ticketData.ticket.requester = { 
        email: propsValue.requester_email,
        ...(propsValue.requester_name && { name: propsValue.requester_name }),
      };
    }

    // Set assignee information
    if (propsValue.assignee_email) {
      try {
        // First, find the user by email to get their ID
        const users = await makeZendeskRequest<{ users: any[] }>(
          authentication,
          `/search.json?query=type:user email:${propsValue.assignee_email}`
        );
        
        if (users.users && users.users.length > 0) {
          ticketData.ticket.assignee_id = users.users[0].id;
        }
      } catch (error) {
        console.warn('Failed to find assignee user:', error);
        // Continue without assignee if user not found
      }
    }

    try {
      const response = await makeZendeskRequest<{ ticket: ZendeskTicket }>(
        authentication,
        '/tickets.json',
        HttpMethod.POST,
        ticketData
      );

      return response.ticket;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error(ZENDESK_ERRORS.UNAUTHORIZED);
      } else if (error.response?.status === 404) {
        throw new Error(ZENDESK_ERRORS.NOT_FOUND);
      } else if (error.response?.status === 429) {
        throw new Error(ZENDESK_ERRORS.RATE_LIMITED);
      } else if (error.response?.status >= 500) {
        throw new Error(ZENDESK_ERRORS.SERVER_ERROR);
      }
      
      throw new Error(`Failed to create ticket: ${error.message}`);
    }
  },
});