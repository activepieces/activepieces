import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../index';
import { makeZendeskRequest, validateZendeskAuth, ZENDESK_ERRORS } from '../common/utils';
import { ZendeskAuthProps, ZendeskComment } from '../common/types';
import { sampleComment } from '../common/sample-data';

export const addCommentToTicket = createAction({
  auth: zendeskAuth,
  name: 'add_comment_to_ticket',
  displayName: 'Add Comment to Ticket',
  description: 'Add a public or private comment to a ticket',
  props: {
    ticket_id: Property.Number({
      displayName: 'Ticket ID',
      description: 'The ID of the ticket to add a comment to',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Comment Body',
      description: 'The content of the comment',
      required: true,
    }),
    public: Property.Checkbox({
      displayName: 'Public Comment',
      description: 'Whether the comment is public (visible to the requester) or private (internal only)',
      required: false,
      defaultValue: true,
    }),
    author_id: Property.Number({
      displayName: 'Author ID',
      description: 'The ID of the user who should be the author of this comment (optional)',
      required: false,
    }),
  },
  sampleData: sampleComment,
  async run(context) {
    const { auth, propsValue } = context;

    if (!validateZendeskAuth(auth)) {
      throw new Error(ZENDESK_ERRORS.INVALID_AUTH);
    }

    const authentication = auth as ZendeskAuthProps;
    
    const updateData = {
      ticket: {
        comment: {
          body: propsValue.body,
          public: propsValue.public !== false, // Default to true if not specified
          ...(propsValue.author_id && { author_id: propsValue.author_id }),
        },
      },
    };

    try {
      const response = await makeZendeskRequest<{ 
        ticket: any; 
        audit: { 
          events: Array<{ 
            type: string; 
            id: number; 
            body?: string; 
            html_body?: string; 
            plain_body?: string; 
            public?: boolean; 
            author_id?: number; 
            attachments?: any[]; 
            audit_id?: number; 
            via?: any; 
          }> 
        } 
      }>(
        authentication,
        `/tickets/${propsValue.ticket_id}.json`,
        HttpMethod.PUT,
        updateData
      );

      // Find the comment event from the audit
      const commentEvent = response.audit?.events?.find(event => event.type === 'Comment');
      
      if (commentEvent) {
        return {
          id: commentEvent.id,
          type: commentEvent.type,
          author_id: commentEvent.author_id || propsValue.author_id,
          body: commentEvent.body || propsValue.body,
          html_body: commentEvent.html_body,
          plain_body: commentEvent.plain_body,
          public: commentEvent.public,
          attachments: commentEvent.attachments || [],
          audit_id: commentEvent.audit_id,
          via: commentEvent.via,
          created_at: new Date().toISOString(),
          metadata: {},
        };
      }

      // Fallback response if audit data is not available
      return {
        id: Date.now(), // Temporary ID
        type: 'Comment',
        author_id: propsValue.author_id,
        body: propsValue.body,
        html_body: propsValue.body,
        plain_body: propsValue.body,
        public: propsValue.public !== false,
        attachments: [],
        audit_id: 0,
        via: {
          channel: 'api',
          source: {},
        },
        created_at: new Date().toISOString(),
        metadata: {},
      };
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
      
      throw new Error(`Failed to add comment to ticket: ${error.message}`);
    }
  },
});