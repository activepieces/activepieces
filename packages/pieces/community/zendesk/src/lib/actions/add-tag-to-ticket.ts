import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../index';
import { makeZendeskRequest, validateZendeskAuth, ZENDESK_ERRORS } from '../common/utils';
import { ZendeskAuthProps, ZendeskTicket } from '../common/types';
import { sampleTicket } from '../common/sample-data';

export const addTagToTicket = createAction({
  auth: zendeskAuth,
  name: 'add_tag_to_ticket',
  displayName: 'Add Tag to Ticket',
  description: 'Add one or more tags to a ticket',
  props: {
    ticket_id: Property.Number({
      displayName: 'Ticket ID',
      description: 'The ID of the ticket to add tags to',
      required: true,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Comma-separated list of tags to add to the ticket',
      required: true,
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
    const tagsToAdd = propsValue.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    if (tagsToAdd.length === 0) {
      throw new Error('No valid tags provided');
    }

    try {
      // First get current ticket to preserve existing tags
      const currentTicket = await makeZendeskRequest<{ ticket: ZendeskTicket }>(
        authentication,
        `/tickets/${propsValue.ticket_id}.json`
      );

      // Merge existing tags with new tags (avoid duplicates)
      const existingTags = currentTicket.ticket.tags || [];
      const allTags = [...new Set([...existingTags, ...tagsToAdd])];

      const updateData = {
        ticket: {
          tags: allTags,
        },
      };

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
      
      throw new Error(`Failed to add tags to ticket: ${error.message}`);
    }
  },
});