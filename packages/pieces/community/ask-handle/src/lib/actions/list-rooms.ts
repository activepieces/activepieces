import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { askHandleAuth } from '../common/auth';
import { askHandleApiCall } from '../common/client';

export const listRooms = createAction({
  auth: askHandleAuth,
  name: 'list_rooms',
  displayName: 'List Rooms',
  description: 'Get a list of all rooms',
  props: {},
  async run(context) {
    return await askHandleApiCall(
      context.auth.secret_text,
      HttpMethod.GET,
      '/rooms/'
    );
  },
});

