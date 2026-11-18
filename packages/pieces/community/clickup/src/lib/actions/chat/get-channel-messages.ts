import { Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  getAccessTokenOrThrow,
  propsValidation,
} from '@activepieces/pieces-common';
import { callClickUpApi3, clickupCommon } from '../../common';
import { clickupAuth } from '../../auth';
import * as z from 'zod/mini'
import { createAction } from '@activepieces/pieces-framework';
import { channelMessagesOutputSchema } from '../../output-schemas';

export const getClickupChannelMessages = createAction({
  auth: clickupAuth,
  name: 'get_channel_messages',
  classification: 'SEARCH',
  description: 'Get the latest messages in a chat channel.',
  audience: 'both',
  aiMetadata: { description: 'Read-only: list the messages in a ClickUp Chat channel, given the workspace and channel IDs, with an optional limit (1-100) and markdown or plain-text content format. Use to read channel history; does not post anything. Safe to call repeatedly.', idempotent: true },
  displayName: 'Get Channel Messages',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    channel_id: clickupCommon.channel_id(true),
    limit: Property.Number({
      description: 'How many messages to return, up to 100.',
      displayName: 'Max Results',
      required: false,
      defaultValue: 50,
      display: 'stepper',
      min: 1,
      max: 100,
      step: 1,
    }),
    content_format: Property.StaticDropdown({
      description: 'How the message text comes back.',
      displayName: 'Content Format',
      required: false,
      display: 'cards',
      options: {
        options: [
          {
            label: 'Markdown',
            value: 'text/md',
            icon: 'markdown',
          },
          {
            label: 'Plain Text',
            value: 'text/plain',
            icon: 'text',
          },
        ],
      },
      defaultValue: 'text/md',
    }),
  },

  outputSchema: channelMessagesOutputSchema,
  async run(configValue) {
    await propsValidation.validateZod(configValue.propsValue, {
      limit: z.number().check(
        z.minimum(1, 'You can fetch between 1 and 100 messages'),
        z.maximum(100, 'You can fetch between 1 and 100 messages')
      ),
    });

    const { workspace_id, channel_id, limit, content_format } =
      configValue.propsValue;

    const response = await callClickUpApi3(
      HttpMethod.GET,
      `workspaces/${workspace_id}/chat/channels/${channel_id}/messages`,
      getAccessTokenOrThrow(configValue.auth),
      undefined,
      {
        limit,
        content_format,
      }
    );

    return response.body;
  },
});
