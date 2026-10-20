import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieRequest } from '../common/client';
import { moxieInput } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieCreateTicketAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_create_ticket',
  classification: 'WRITE',
  displayName: 'Create Ticket',
  description: 'Open a support ticket.',
  audience: 'both',
  aiMetadata: {
    description:
      'Opens a Moxie support ticket with a subject, first comment, ticket type label and due date, on behalf of the workspace user or client contact with the given email. Use to log a client request that arrived outside the client portal. Not idempotent: each call opens another ticket.',
    idempotent: false,
  },
  outputSchema: moxieActionOutputSchemas.ticketWrapper,
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Short summary of the request.',
      required: true,
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'The first message on the ticket.',
      required: false,
    }),
    userEmail: Property.ShortText({
      displayName: 'Requester Email',
      description: 'Email of the client contact or workspace user who raised the ticket.',
      required: false,
    }),
    ticketType: Property.ShortText({
      displayName: 'Ticket Type',
      description: 'Ticket type label as configured in Moxie, for example Support.',
      required: false,
    }),
    dueDate: Property.ShortText({
      displayName: 'Due Date',
      description: 'Date in YYYY-MM-DD format.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return moxieRequest<unknown>({
      credentials: credentialsOf({ auth }),
      method: HttpMethod.POST,
      path: '/action/tickets/create',
      body: moxieInput.compact({
        values: {
          subject: moxieInput.requiredText({ value: propsValue.subject, field: 'Subject' }),
          comment: moxieInput.text({ value: propsValue.comment }),
          userEmail: moxieInput.email({ value: propsValue.userEmail, field: 'Requester Email' }),
          ticketType: moxieInput.text({ value: propsValue.ticketType }),
          dueDate: moxieInput.date({ value: propsValue.dueDate, field: 'Due Date' }),
        },
      }),
      notFoundMessage: 'Moxie could not find the requester or ticket type. Check the email and the ticket type label.',
    });
  },
});
