import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieRequest } from '../common/client';
import { moxieInput } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieAddTicketCommentAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_add_ticket_comment',
  classification: 'WRITE',
  displayName: 'Add Ticket Comment',
  description: 'Add a comment to a ticket.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds a comment to a Moxie ticket identified by its ticket number, as public reply or private internal note. Needs the email of a workspace user or client contact as author, and only works on tickets that belong to a client. Use to post an update or answer on an existing ticket; ticket numbers come from Search Tickets, List Tickets or Create Ticket. Not idempotent: each call adds another comment.',
    idempotent: false,
  },
  outputSchema: moxieActionOutputSchemas.ticketWrapper,
  props: {
    ticketNumber: Property.Number({
      displayName: 'Ticket Number',
      description: 'The ticket number (not the id), from Search Tickets or Create Ticket.',
      required: true,
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      required: true,
    }),
    userEmail: Property.ShortText({
      displayName: 'Author Email',
      description: 'Email of the workspace user or client contact posting the comment.',
      required: true,
    }),
    privateComment: Property.Checkbox({
      displayName: 'Private Note',
      description: 'On keeps the comment internal; off (default) shows it to the client.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const ticketNumber = moxieInput.integer({ value: propsValue.ticketNumber, field: 'Ticket Number', min: 1 });
    if (ticketNumber === undefined) {
      throw new Error('Ticket Number is required.');
    }
    const userEmail = moxieInput.email({ value: propsValue.userEmail, field: 'Author Email' });
    if (userEmail === undefined) {
      throw new Error('Author Email is required.');
    }
    return moxieRequest<unknown>({
      credentials: credentialsOf({ auth }),
      method: HttpMethod.POST,
      path: '/action/tickets/comments/create',
      body: moxieInput.compact({
        values: {
          ticketNumber,
          comment: moxieInput.requiredText({ value: propsValue.comment, field: 'Comment' }),
          userEmail,
          privateComment: moxieInput.triState({ value: propsValue.privateComment, field: 'Private Note' }) === true ? true : undefined,
        },
      }),
      notFoundMessage: `No ticket number ${ticketNumber} with a client in this Moxie workspace. Comments can only be added to tickets that belong to a client.`,
    });
  },
});
