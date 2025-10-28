import { Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  getAccessTokenOrThrow,
  propsValidation,
} from '@activepieces/pieces-common';
import { callClickUpApi3, clickupCommon } from '../../common';
import { clickupAuth } from '../../../';
import { z } from 'zod';
import { createAction } from '@activepieces/pieces-framework';

export const getClickupChannelMessages = createAction({
  auth: clickupAuth,
  name: 'get_channel_messages',
  description: 'Gets all messages in a ClickUp channel',
  displayName: 'Get Channel Messages',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    channel_id: clickupCommon.channel_id(),
    limit: Property.Number({
      description: 'Limit the number of messages returned',
      displayName: 'Limit',
      required: false,
      defaultValue: 50,
    }),
    content_format: Property.StaticDropdown({
      description: 'Format the content of the messages',
      displayName: 'Format Content',
      required: false,
      options: {
        options: [
          { label: 'Markdown', value: 'text/md' },
          { label: 'Plain Text', value: 'text/plain' },
        ],
      },
      defaultValue: 'text/md',
    }),
  },

  async run(configValue) {
    await propsValidation.validateZod(configValue.propsValue, {
      limit: z
        .number()
        .min(0)
        .max(100, 'You can fetch between 1 and 100 messages'),
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
