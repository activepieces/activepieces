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
  replyBroadcast,
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
    const messageParams: any = {
      text,
      channel: conversationId,
      username,
      icon_url: profilePicture,
      blocks: blocks as Block[],
      thread_ts: threadTs,
    };
    
    if (replyBroadcast) {
      messageParams.reply_broadcast = replyBroadcast;
    }
    
    return await client.chat.postMessage(messageParams);
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
  replyBroadcast?: boolean;
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

export function getFirstFiveOrAll(array: unknown[]) {
  if (array.length <= 5) {
    return array;
  } else {
    return array.slice(0, 5);
  }
}

/**
* Parse a message text to extract command and arguments
*/
export function parseCommand(
 text: string,
 botUserId: string,
 validCommands: string[]
): { command: string; args: string[] } | null {
 if (!botUserId) {
   return null;
 }

 // Check if the message mentions the bot
 const mentionRegex = new RegExp(`<@${botUserId}>\\s+(.+)`, 's');
 const mentionMatch = text.match(mentionRegex);

 if (!mentionMatch) {
   return null;
 }

 // Extract the text after the mention
 const commandText = mentionMatch[1].trim();

 // Split into command and arguments (first word is command, rest are args)
 const parts = commandText.split(/\s+/);
 const command = parts[0].toLowerCase();
 const args = parts.slice(1);

 // Check if it's a valid command
 if (!validCommands.includes(command)) {
   return null;
 }

 return {
   command,
   args,
 };
}