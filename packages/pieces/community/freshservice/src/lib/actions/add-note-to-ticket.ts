import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { freshserviceApiCall } from '../common/client';
import { freshserviceCommon } from '../common/props';

export const addNoteToTicket = createAction({
  auth: freshserviceAuth,
  name: 'add_note_to_ticket',
  displayName: 'Add Note to Ticket',
  description: 'Adds a private or public note to an existing ticket.',
  props: {
    ticket_id: freshserviceCommon.ticket(true),
    body: Property.LongText({
      displayName: 'Note Content',
      description: 'The content of the note. HTML is supported.',
      required: true,
    }),
    private: Property.Checkbox({
      displayName: 'Private Note',
      description: 'If checked, the note is only visible to agents. If unchecked, the requester can also see it.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const response = await freshserviceApiCall<{ conversation: Record<string, unknown> }>({
      method: HttpMethod.POST,
      endpoint: `tickets/${context.propsValue.ticket_id}/notes`,
      auth: context.auth,
      body: {
        body: context.propsValue.body,
        private: context.propsValue.private ?? true,
      },
    });

    return response.body.conversation;
  },
});
