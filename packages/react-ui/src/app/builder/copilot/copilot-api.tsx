import { Socket } from 'socket.io-client';
import {
  AskCopilotRequest,
  AskCopilotResponse,
  WebsocketClientEvent,
  WebsocketServerEvent,
} from '@activepieces/shared';
import { nanoid } from 'nanoid';

export const copilotApi = {
  ask: async (
    socket: Socket,
    request: Omit<AskCopilotRequest, 'id'>,
  ): Promise<AskCopilotResponse> => {
    const id = nanoid();

    socket.emit(WebsocketServerEvent.ASK_COPILOT, {
      ...request,
      id,
    });

    return new Promise<AskCopilotResponse>((resolve, reject) => {
      socket.on(
        WebsocketClientEvent.ASK_COPILOT_RESPONSE,
        (response: AskCopilotResponse) => {
          if (response.id === id) {
            resolve(response);
          }
        },
      );

      socket.on('error', (error: unknown) => {
        reject(error);
      });
    });
  },
};