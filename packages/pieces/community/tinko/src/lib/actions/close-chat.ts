import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { tinkoAuth } from '../auth';
import { TinkoItemResponse, tinkoClient } from '../common/client';
import { tinkoChat } from '../common/chat';
import { tinkoProps } from '../common/props';

export const closeChatAction = createAction({
  auth: tinkoAuth,
  name: 'close_chat',
  classification: 'WRITE',
  displayName: 'Close Chat',
  description: 'Finishes an open chat.',
  audience: 'both',
  aiMetadata: {
    description:
      'Close (finish) an open Tinko chat by ID, optionally recording which attendant closed it and asking Tinko to generate an AI summary. Tinko returns a conflict error when the chat is already finished, so a retry after success fails instead of changing anything.',
    idempotent: false,
  },
  props: {
    chatId: tinkoChat.chatId(),
    attendant: tinkoProps.attendantDropdown({
      description: 'The Tinko user registered as the one who closed the chat. Leave empty to close it as the company.',
    }),
    generateSummary: Property.Checkbox({
      displayName: 'Generate Summary',
      description: 'Whether Tinko should generate an AI summary of the chat after closing it.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { chatId, attendant, generateSummary } = context.propsValue;
    const id = chatId.trim();
    const response = await tinkoClient.request<
      TinkoItemResponse<{ chatId?: string; is_open?: boolean; status?: string }>
    >({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `${tinkoClient.pathFor('chats', id)}/close`,
      body: {
        ...(attendant ? { attendant } : {}),
        generate_summary: generateSummary === true,
      },
    });
    return {
      chat_id: response.data?.chatId ?? id,
      is_open: response.data?.is_open ?? false,
      status: response.data?.status ?? 'finished',
    };
  },
});
