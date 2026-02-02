import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { askHandleAuth } from '../common/auth';
import { askHandleApiCall } from '../common/client';
import { roomDropdown } from '../common/props';

export const createMessage = createAction({
  auth: askHandleAuth,
  name: 'create_message',
  displayName: 'Create Message',
  description: 'Send a message to a room',
  props: {
    room: roomDropdown,
    body: Property.LongText({
      displayName: 'Message',
      description: 'The message content',
      required: true,
    }),
    nickname: Property.ShortText({
      displayName: 'Nickname',
      description: 'Sender nickname',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Sender email',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Sender phone number',
      required: false,
    }),
  },
  async run(context) {
    const { room, body, nickname, email, phone_number } = context.propsValue;

    const payload: any = {
      body,
      room: {
        uuid: room,
      },
    };

    if (nickname) payload.nickname = nickname;
    if (email) payload.email = email;
    if (phone_number) payload.phone_number = phone_number;

    return await askHandleApiCall(
      context.auth.secret_text,
      HttpMethod.POST,
      '/messages/',
      payload
    );
  },
});

