import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi3, clickupCommon } from '../../common';
import { clickupAuth } from '../../auth';

export const getClickupChannel = createAction({
  auth: clickupAuth,
  name: 'get_channel',
  description: 'Gets a channel in a ClickUp workspace',
  audience: 'both',
  aiMetadata: { description: 'Read-only: fetch the details of a single ClickUp Chat channel by its workspace and channel IDs. Use when you already know the channel ID; to discover channels first, use Get Channels. Safe to call repeatedly.', idempotent: true },
  displayName: 'Get Channel',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    channel_id: clickupCommon.channel_id(),
  },
  
  async run(configValue) {
    const { workspace_id, channel_id } = configValue.propsValue;
    const response = await callClickUpApi3(
      HttpMethod.GET,
      `workspaces/${workspace_id}/chat/channels/${channel_id}`,
      getAccessTokenOrThrow(configValue.auth),
      undefined,
      {}
    );
    return response.body;
  },
});
