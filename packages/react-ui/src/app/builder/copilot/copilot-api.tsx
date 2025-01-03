import { Socket } from 'socket.io-client';
import {
  CopilotFlowPlanResponse,
  WebsocketClientEvent,
  WebsocketServerEvent,
} from '@activepieces/shared';
import { nanoid } from 'nanoid';

export const copilotApi = {
  planFlow: async (
    socket: Socket,
    prompts: string[],
  ): Promise<CopilotFlowPlanResponse> => {
    const id = nanoid();

    socket.emit(WebsocketServerEvent.ASK_COPILOT, {
      prompts,
      id,
    });

    return new Promise<CopilotFlowPlanResponse>((resolve, reject) => {
      socket.on(
        WebsocketClientEvent.ASK_COPILOT_RESPONSE,
        (response: CopilotFlowPlanResponse) => {
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