import { createAction, Property } from '@activepieces/pieces-framework';
import { webexAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findRoom = createAction({
  auth: webexAuth,
  name: 'findRoom',
  displayName: 'find room',
  description: 'Retrieve details for a specific room by room id',
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
      (context.auth as any).access_token,
      HttpMethod.GET,
      `/messages/${encodeURIComponent(roomId)}`,
    );

    return response;
  },
});
