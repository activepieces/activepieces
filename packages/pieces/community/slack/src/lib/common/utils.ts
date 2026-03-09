import { ApFile } from '@activepieces/pieces-framework';
import { Block, KnownBlock, WebClient } from '@slack/web-api';

const SLACK_SECTION_TEXT_MAX_LENGTH = 3000;

export function textToSectionBlocks(text: string): (KnownBlock | Block)[] {
  if (text.length <= SLACK_SECTION_TEXT_MAX_LENGTH) {
    return [{ type: 'section', text: { type: 'mrkdwn', text } }];
  }

  const blocks: (KnownBlock | Block)[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= SLACK_SECTION_TEXT_MAX_LENGTH) {
      blocks.push({ type: 'section', text: { type: 'mrkdwn', text: remaining } });
      break;
    }

    let splitIndex = remaining.lastIndexOf('\n', SLACK_SECTION_TEXT_MAX_LENGTH);
    if (splitIndex <= 0) {
      splitIndex = remaining.lastIndexOf(' ', SLACK_SECTION_TEXT_MAX_LENGTH);
    }
    if (splitIndex <= 0) {
      splitIndex = SLACK_SECTION_TEXT_MAX_LENGTH;
    }

    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: remaining.substring(0, splitIndex) } });
    remaining = remaining.substring(splitIndex).trimStart();
  }

  return blocks;
}

export function buildFlowOriginContextBlock(context: {
  server: { publicUrl: string };
  project: { id: string };
  flows: { current: { id: string } };
}): KnownBlock {
  return {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Message sent by <${new URL(context.server.publicUrl).origin}/projects/${context.project.id}/flows/${context.flows.current.id}|this flow>.`
      }
    ]
  };
}

export const slackSendMessage = async ({
  text,
  conversationId,
  username,
  profilePicture,
  iconEmoji,
  blocks,
  threadTs,
  token,
  file,
  replyBroadcast,
  unfurlLinks,
}: SlackSendMessageParams) => {
  const client = new WebClient(token);

  if (file) {
    return await client.files.uploadV2({
      channel_id: conversationId,
      initial_comment: text,
      thread_ts: threadTs,
      blocks: blocks as Block[],
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
      icon_emoji: iconEmoji,
      blocks: blocks as Block[],
      thread_ts: threadTs,
    };

    if (replyBroadcast) {
      messageParams.reply_broadcast = replyBroadcast;
    }

    if (unfurlLinks === false) {
      messageParams.unfurl_links = false;
    }

    return await client.chat.postMessage(messageParams);
  }
};

type SlackSendMessageParams = {
  token: string;
  conversationId: string;
  username?: string;
  profilePicture?: string;
  iconEmoji?: string;
  blocks?: unknown[] | Record<string, any>;
  text?: string;
  file?: ApFile;
  threadTs?: string;
  replyBroadcast?: boolean;
  unfurlLinks?: boolean;
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
