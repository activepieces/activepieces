import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostCreateChannelCategoryOutputSchema } from '../../../output-schemas';

export const updateChannelCategoryAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_update_channel_category',
  outputSchema: mattermostCreateChannelCategoryOutputSchema,
  displayName: 'Update Sidebar Category',
  description: 'Renames, reorders, mutes or collapses one of a user\'s sidebar categories.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes one sidebar category of a user in a team: name, channel list and order, sorting, muted or collapsed; pass "me" for the connected account. Fields left empty stay as they are. Channel IDs replaces the category\'s whole channel list. Set at least one field; to change several categories at once use Update Sidebar Categories.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    teamId: mattermostAiProps.teamId({ required: true }),
    categoryId: Property.ShortText({
      displayName: 'Category ID',
      description: 'Sidebar category ID. Use List Sidebar Categories to find it.',
      required: true,
    }),
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'New category name. Only custom categories can be renamed.',
      required: false,
    }),
    channelIds: Property.Array({
      displayName: 'Channel IDs',
      description: 'The full ordered list of channel IDs for this category; channels added here leave their old category.',
      required: false,
    }),
    sorting: Property.StaticDropdown({
      displayName: 'Sorting',
      description: '"alpha" for alphabetical, "recent" for most recent activity, "manual" for the Channel IDs order.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Alphabetical', value: 'alpha' },
          { label: 'Recent Activity', value: 'recent' },
          { label: 'Manual', value: 'manual' },
        ],
      },
    }),
    muted: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Muted',
      description: '"true" to mute every channel in the category, "false" to unmute.',
    }),
    collapsed: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Collapsed',
      description: '"true" to collapse the category in the sidebar, "false" to expand it.',
    }),
  },
  async run(context) {
    const { userId, teamId, categoryId, displayName, channelIds, sorting, muted, collapsed } =
      context.propsValue;
    if (sorting !== undefined && sorting !== 'alpha' && sorting !== 'recent' && sorting !== 'manual') {
      throw new Error(`Sorting must be "alpha", "recent" or "manual", got "${sorting}".`);
    }
    const isMuted = mattermostUtils.parseBoolean({ value: muted });
    const isCollapsed = mattermostUtils.parseBoolean({ value: collapsed });
    const changes = {
      ...(displayName !== undefined ? { display_name: displayName } : {}),
      ...(channelIds && channelIds.length > 0 ? { channel_ids: channelIds } : {}),
      ...(sorting !== undefined ? { sorting } : {}),
      ...(isMuted !== undefined ? { muted: isMuted } : {}),
      ...(isCollapsed !== undefined ? { collapsed: isCollapsed } : {}),
    };
    if (Object.keys(changes).length === 0) {
      throw new Error('Set at least one of Display Name, Channel IDs, Sorting, Muted or Collapsed.');
    }
    const path = `/users/${encodeURIComponent(userId)}/teams/${encodeURIComponent(teamId)}/channels/categories/${encodeURIComponent(categoryId)}`;
    const current = await mattermostClient.request<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.GET,
      path,
    });
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path,
      body: { ...current, ...changes },
    });
  },
});
