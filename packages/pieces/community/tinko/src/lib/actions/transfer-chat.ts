import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { tinkoAuth } from '../auth';
import { TinkoItemResponse, tinkoClient } from '../common/client';
import { tinkoChat } from '../common/chat';
import { tinkoProps } from '../common/props';

export const transferChatAction = createAction({
  auth: tinkoAuth,
  name: 'transfer_chat',
  classification: 'WRITE',
  displayName: 'Transfer Chat',
  description: 'Moves a chat to another channel or attendant.',
  audience: 'both',
  aiMetadata: {
    description:
      'Transfer an open Tinko chat to another channel (department queue) and optionally to a specific attendant, with an optional internal message for the team. Use it to hand a conversation from a bot or one team to another. Transferring again to the same target leaves the chat in the same place.',
    idempotent: true,
  },
  props: {
    chatId: tinkoChat.chatId(),
    channel: tinkoProps.channelDropdown({
      description: 'The channel that receives the chat. Use the current channel to only change the attendant.',
    }),
    attendant: tinkoProps.attendantDropdown({
      description: 'The Tinko user that receives the chat. Leave empty to send it to the channel queue.',
    }),
    message: Property.LongText({
      displayName: 'Internal Message',
      description: 'Note recorded with the transfer and visible only to the team, up to 1000 characters.',
      required: false,
    }),
  },
  async run(context) {
    const { chatId, channel, attendant, message } = context.propsValue;
    const id = chatId.trim();
    const response = await tinkoClient.request<
      TinkoItemResponse<{ chatId?: string; channel?: string; attendant?: string | null }>
    >({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `${tinkoClient.pathFor('chats', id)}/transfer`,
      body: {
        channel,
        ...(attendant ? { attendant } : {}),
        ...(message ? { message } : {}),
      },
    });
    return {
      chat_id: response.data?.chatId ?? id,
      channel_id: response.data?.channel ?? channel,
      attendant_id: response.data?.attendant ?? null,
    };
  },
});
