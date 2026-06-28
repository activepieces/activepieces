import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';
import FormData from 'form-data';

interface FileObject {
  file: ApFile;
}

export const discordSendMessage = createAction({
  auth: discordAuth,
  name: 'discord_send_message',
  displayName: 'Send Message',
  description: 'Post a message to a Discord channel or thread.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Posts a message to a Discord channel or thread by channel ID (POST /channels/{channel_id}/messages). Resolve a channel name to its ID with Find Channel or List Channels first. Each call creates a new message, so it is not idempotent. Requires the bot to have Send Messages access to the channel.',
    idempotent: false,
  },
  props: {
    channel_id: Property.ShortText({
      displayName: 'Channel ID',
      description:
        'The numeric Discord channel or thread ID (e.g. "1080123456789012345"). Resolve a name to an ID with Find Channel or List Channels.',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Message',
      description: 'The text content of the message. Up to 2000 characters.',
      required: false,
    }),
    files: Property.Array({
      displayName: 'Attachments',
      description: 'Optional files to attach to the message.',
      properties: {
        file: Property.File({
          displayName: 'File',
          description: 'A file to send with the message.',
          required: false,
        }),
      },
      required: false,
      defaultValue: [],
    }),
  },
  async run(configValue) {
    const channelId = configValue.propsValue.channel_id;
    const message = configValue.propsValue.content;
    const files = (configValue.propsValue.files as FileObject[]) ?? [];

    const hasFiles = Array.isArray(files) && files.length > 0;
    if (!hasFiles && (message === undefined || message === null || message === '')) {
      throw new Error(
        'Provide message content or at least one attachment — Discord rejects an empty message.'
      );
    }

    const url = `https://discord.com/api/v10/channels/${channelId}/messages`;
    const authHeader = `Bot ${configValue.auth.secret_text}`;

    let request: HttpRequest;
    if (hasFiles) {
      // Multipart upload: Discord requires the message JSON in a `payload_json`
      // field alongside the files[n] parts (NOT a bare `content` field).
      const formData = new FormData();
      formData.append('payload_json', JSON.stringify({ content: message ?? '' }));
      files.forEach((fileObj, index) => {
        const file = fileObj.file;
        formData.append(`files[${index}]`, file.data, file.filename);
      });
      request = {
        method: HttpMethod.POST,
        url,
        headers: { authorization: authHeader, ...formData.getHeaders() },
        body: formData,
      };
    } else {
      // Text-only message: a plain JSON body — no multipart.
      request = {
        method: HttpMethod.POST,
        url,
        headers: { authorization: authHeader },
        body: { content: message },
      };
    }

    try {
      const res = await httpClient.sendRequest<never>(request);
      return res.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error(
          'Discord denied the request (403). The bot lacks Send Messages access to this channel.'
        );
      }
      if (status === 404) {
        throw new Error(
          'Channel not found (404). Verify the channel_id; resolve it with Find Channel or List Channels.'
        );
      }
      if (status === 429) {
        throw new Error('Discord rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
