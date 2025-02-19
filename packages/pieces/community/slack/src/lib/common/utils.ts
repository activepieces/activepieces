import { ApFile } from '@activepieces/pieces-framework';
import { Block, WebClient } from '@slack/web-api';

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
  const client = new WebClient(token);

  if (file) {
    return await client.files.uploadV2({
      channel_id: conversationId,
      initial_comment: text,
      thread_ts: threadTs,
      file_uploads: [
        {
          file: file.data,
          filename: file.filename,
        },
      ],
    });
  } else {
    return await client.chat.postMessage({
      text,
      channel: conversationId,
      username,
      icon_url: profilePicture,
      blocks: blocks as Block[],
      thread_ts: threadTs,
    });
  }
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

export function processMessageTimestamp(input: string) {
  // Regular expression to match a URL containing the timestamp
  const urlRegex = /\/p(\d+)(\d{6})$/;
  // Check if the input is a URL
  const urlMatch = input.match(urlRegex);
  if (urlMatch) {
    const timestamp = `${urlMatch[1]}.${urlMatch[2]}`;
    return timestamp;
  }

  // Check if the input is already in the desired format
  const timestampRegex = /^(\d+)\.(\d{6})$/;
  const timestampMatch = input.match(timestampRegex);
  if (timestampMatch) {
    return input;
  }

  return undefined;
}
