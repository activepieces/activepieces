import { httpClient, AuthenticationType, HttpMethod } from "@activepieces/pieces-common";
import { StatusCodes } from "http-status-codes";

export interface WonderchatAuth {
  apiKey: string;
  chatbotId: string;
}

export interface ChatRequest {
  chatbotId: string;
  question: string;
  chatlogId?: string;
  context?: string;
  contextUrl?: string;
}

export interface ChatResponse {
  response: string;
  chatlogId: string;
  sources: Array<{
    url: string;
    title: string;
  }>;
}

export const makeClient = (auth: WonderchatAuth) => {
  return {
    async validateAuth(): Promise<boolean> {
      try {
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: 'https://app.wonderchat.io/api/v1/chatbots',
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth.apiKey,
          },
        });
        return response.status === StatusCodes.OK;
      } catch (error) {
        return false;
      }
    },

    async sendMessage(request: ChatRequest): Promise<ChatResponse> {
      const response = await httpClient.sendRequest<ChatResponse>({
        method: HttpMethod.POST,
        url: 'https://app.wonderchat.io/api/v1/chat',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.apiKey,
        },
        body: request,
      });

      if (response.status !== StatusCodes.OK) {
        throw new Error(`Wonderchat API error: ${response.status}`);
      }

      return response.body;
    }
  };
};
