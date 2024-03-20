import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpResponse,
} from '@activepieces/pieces-common';
import { ApFile } from '@activepieces/pieces-framework';

export const slackSendMessage = async ({
  text,
  conversationId,
  username,
  profilePicture,
  blocks,
  threadTs,
  token,
  file,
}: SlackSendMessageParams) => {
  let response: HttpResponse;
  let request: HttpRequest;

  if (file) {
    const formData = new FormData();
    formData.append('file', new Blob([file.data]));
    formData.append('channels', conversationId);
    formData.append('initial_comment', text);
    if (threadTs) formData.append('thread_ts', threadTs);

    request = {
      url: `https://slack.com/api/files.upload`,
      method: HttpMethod.POST,
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
    };
    response = await httpClient.sendRequest(request);
  } else {
    const body: any = {
      text,
      channel: conversationId,
    };

    if (username) body['username'] = username;
    if (profilePicture) body['icon_url'] = profilePicture;
    if (blocks) body['blocks'] = blocks;
    if (threadTs) body['thread_ts'] = threadTs;

    request = {
      method: HttpMethod.POST,
      url: 'https://slack.com/api/chat.postMessage',
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
    };

    response = await httpClient.sendRequest(request);
  }

  if (!response.body.ok) {
    switch (response.body.error) {
      case 'not_in_channel':
        throw new Error(JSON.stringify({
          message: 'The bot is not in the channel',
          code: 'not_in_channel',
          action: 'Invite the bot from the channel settings'
        }));
      default: {
        throw new Error(response.body.error);
      }
    }
  }

  return {
    success: true,
    request_body: request.body,
    response_body: response.body,
  };
};

type SlackSendMessageParams = {
  token: string;
  conversationId: string;
  username?: string;
  profilePicture?: string;
  blocks?: unknown[] | Record<string, any>;
  text: string;
  file?: ApFile;
  threadTs?: string;
};
