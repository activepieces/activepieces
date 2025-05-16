import {
  ChatBotxRequest,
  ChatBotxResponse,
  ChatBotxToken,
  ChatBotxTokenResponse,
  ChatBotxUserMessage,
  isNil,
} from '@activepieces/shared';

import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

type BotxApiParams = {
  BOTX_API_URL?: string | null;
  ZERO_API_URL?: string | null;
};

export const botxApi = ({ BOTX_API_URL, ZERO_API_URL }: BotxApiParams) => ({
  sendMessage(request: ChatBotxRequest): Promise<ChatBotxResponse> {
    if (isNil(BOTX_API_URL)) return Promise.reject('invalid bot URL');
    return api.post<ChatBotxResponse>(
      `${BOTX_API_URL}/v1/chat/sse`,
      request,
      null,
      {
        Authorization: `Bearer ${authenticationSession.getBotxToken()}`,
      },
    );
  },

  getLastUserChatMessages(): Promise<ChatBotxUserMessage[]> {
    if (isNil(BOTX_API_URL)) return Promise.reject('invalid bot URL');
    return api.get<ChatBotxUserMessage[]>(
      `${BOTX_API_URL}/v1/chat`,
      '',
      undefined,
      {
        Authorization: `Bearer ${authenticationSession.getBotxToken()}`,
      },
    );
  },

  getSignBotxJwt(request: ChatBotxToken): Promise<ChatBotxTokenResponse> {
    if (isNil(ZERO_API_URL)) return Promise.reject('invalid zero service URL');
    return api.post<ChatBotxTokenResponse>(
      `${ZERO_API_URL}/pmtx/sign-jwt-botx`,
      request,
    );
  },
});
