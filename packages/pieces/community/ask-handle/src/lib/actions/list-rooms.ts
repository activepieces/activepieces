import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { askHandleAuth } from '../common/auth';
import { askHandleApiCall } from '../common/client';

export const listRooms = createAction({
  auth: askHandleAuth,
  name: 'list_rooms',
  displayName: 'List Rooms',
  description: 'Get a list of all rooms',
  audience: 'both',
  aiMetadata: { description: 'Retrieves all chat rooms in the AskHandle account. Use to discover available rooms or look up a room UUID before sending a message. Takes no input and is a read-only lookup, so it is idempotent.', idempotent: true },
  props: {},
  async run(context) {
    return await askHandleApiCall(
      context.auth.secret_text,
      HttpMethod.GET,
      '/rooms/'
    );
  },
});

