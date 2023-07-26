import { AuthenticationType, httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";

export const slackSendMessage = async ({ text, conversationId, username, profilePicture, blocks, token }: SlackSendMessageParams) => {
  const body: any = {
    text,
    channel: conversationId,
  }

  if (username) body['username'] = username
  if (profilePicture) body['icon_url'] = profilePicture
  if (blocks) body['blocks'] = blocks
  
  const request: HttpRequest<SlackSendMessageRequestBody> = {
    method: HttpMethod.POST,
    url: 'https://slack.com/api/chat.postMessage',
    body,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
  }

  const response = await httpClient.sendRequest(request)

  return {
    success: true,
    request_body: request.body,
    response_body: response.body,
  }
}

type SlackSendMessageRequestBody = {
  text: string
  channel: string
}

type SlackSendMessageParams = {
  token: string
  conversationId: string
  username?: string
  profilePicture?: string
  blocks?: unknown[]
  text: string
}
