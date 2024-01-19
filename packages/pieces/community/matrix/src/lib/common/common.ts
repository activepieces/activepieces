import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpResponse,
} from '@activepieces/pieces-common';

export async function getRoomId(
  baseUrl: string,
  roomAlias: string,
  accessToken: string
): Promise<HttpResponse> {
  const response = httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${baseUrl}/_matrix/client/r0/directory/room/${encodeURIComponent(
      roomAlias
    )}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
  });

  return response;
}

export async function sendMessage(
  baseUrl: string,
  roomId: string,
  accessToken: string,
  message: string
): Promise<HttpResponse> {
  const response = httpClient.sendRequest({
    method: HttpMethod.POST,
    url:
      `${baseUrl}/_matrix/client/r0/rooms/` + roomId + '/send/m.room.message',
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
    body: {
      msgtype: 'm.text',
      body: message,
    },
  });

  return response;
}
