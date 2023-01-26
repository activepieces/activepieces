import { AuthenticationType } from "../../../common/authentication/core/authentication-type";
import { httpClient } from "../../../common/http/core/http-client";
import { HttpMethod } from "../../../common/http/core/http-method";
import { HttpRequest } from "../../../common/http/core/http-request";

export const slackSendMessage = async ({ text, conversationId, token }: SlackSendMessageParams) => {
  const request: HttpRequest<SlackSendMessageRequestBody> = {
    method: HttpMethod.POST,
    url: 'https://slack.com/api/chat.postMessage',
    body: {
      text,
      channel: conversationId,
    },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
  };

  const response = await httpClient.sendRequest(request);

  return {
    success: true,
    request_body: request.body,
    response_body: response.body,
  };
};

type SlackSendMessageRequestBody = {
  text: string;
  channel: string;
}

type SlackSendMessageParams = {
  token: string;
  conversationId: string;
  text: string;
}
