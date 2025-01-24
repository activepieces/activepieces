import { Socket } from 'socket.io-client';
import {
  AskCopilotRequest,
  WebsocketServerEvent,
} from '@activepieces/shared';
import { nanoid } from 'nanoid';

export const copilotApi = {
  ask: async (
    socket: Socket,
    request: AskCopilotRequest,
  ): Promise<void> => {
    socket.emit(WebsocketServerEvent.ASK_COPILOT, {
      ...request,
      id: request.id ?? nanoid(),
    });
  },
};