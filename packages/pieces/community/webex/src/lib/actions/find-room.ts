import { createAction, Property } from '@activepieces/pieces-framework';
import { webexAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findRoom = createAction({
  auth: webexAuth,
  name: 'findRoom',
  displayName: 'Find room',
  description: 'Retrieve details for a specific room by room id',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves the details of a single Webex room (space) by its room ID. Use it to look up a known room\'s metadata. Read-only and idempotent; requires the exact room ID (this is not a search across rooms).',
    idempotent: true,
  },
  props: {
    roomId: Property.ShortText({
      displayName: 'Room Id',
      description: '',
      required: true,
    }),
  },
  async run(context) {
    const roomId = context.propsValue.roomId as string;

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.GET,
      `/rooms/${encodeURIComponent(roomId)}`,
      undefined
    );

    return response;
  },
});
