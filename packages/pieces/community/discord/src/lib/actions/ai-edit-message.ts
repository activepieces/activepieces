import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { discordAuth } from '../auth';

export const discordEditMessage = createAction({
  auth: discordAuth,
  name: 'discord_edit_message',
  displayName: 'Edit Message',
  description: "Edit the content of one of the bot's own messages.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Edits the text content of an existing message by channel ID and message ID (PATCH /channels/{channel_id}/messages/{message_id}). Only the bot's OWN messages can be edited (editing another author's message returns 403). Idempotent: re-applying the same content yields the same state.",
    idempotent: true,
  },
  props: {
    channel_id: Property.ShortText({
      displayName: 'Channel ID',
      description: 'The numeric channel ID containing the message.',
      required: true,
    }),
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description:
        'The numeric message ID to edit. Obtain from List Messages or the trigger payload.',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'New Content',
      description: 'The new message text. Up to 2000 characters.',
      required: true,
    }),
  },
  async run(configValue) {
    const request: HttpRequest<any> = {
      method: HttpMethod.PATCH,
      url: `https://discord.com/api/v9/channels/${configValue.propsValue.channel_id}/messages/${configValue.propsValue.message_id}`,
      headers: {
        authorization: `Bot ${configValue.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body: {
        content: configValue.propsValue.content,
      },
    };

    try {
      const res = await httpClient.sendRequest<any>(request);
      return {
        success: res.status === 200,
        id: res.body?.id,
        content: res.body?.content,
        edited_timestamp: res.body?.edited_timestamp,
      };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error(
          "Discord denied the request (403). The bot can only edit its own messages."
        );
      }
      if (status === 404) {
        throw new Error('Channel or message not found (404). Verify the IDs.');
      }
      if (status === 429) {
        throw new Error('Discord rate limit hit (429). Retry after a short delay.');
      }
      throw error;
    }
  },
});
