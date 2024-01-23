import { createAction, Property } from '@activepieces/pieces-framework';
import { getRoomId, sendMessage as sendMatrixMessage } from '../common/common';
import { matrixAuth } from '../..';

export const sendMessage = createAction({
  auth: matrixAuth,
  name: 'send_message',
  displayName: 'Send Message',
  description: 'Send a message to a room',
  props: {
    room_alias: Property.ShortText({
      displayName: 'Room Alias',
      description:
        'Copy it from room settings -> advanced -> room addresses -> main address',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The message to send',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const baseUrl = auth.base_url.replace(/\/$/, '');
    const accessToken = auth.access_token;
    const roomId = (
      await getRoomId(baseUrl, propsValue.room_alias, accessToken)
    ).body.room_id;

    return await sendMatrixMessage(
      baseUrl,
      roomId,
      accessToken,
      propsValue.message
    );
  },
});
