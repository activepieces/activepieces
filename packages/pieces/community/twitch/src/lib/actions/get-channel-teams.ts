import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon } from '../common';

export const getChannelTeams = createAction({
  auth: twitchAuth,
  name: 'get_channel_teams',
  displayName: 'Get Channel Teams',
  description: 'List the teams a channel belongs to.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'List the Twitch teams a broadcaster is a member of (default: the connected account). Returns teams[] with id, team_name, team_display_name, info (HTML), thumbnail_url, banner, background_image_url, created_at and updated_at, plus broadcaster_id/login/name. A channel in no team returns an empty list.',
    idempotent: true,
  },
  props: {
    broadcaster_id: twitchCommon.props.broadcasterId(),
  },
  outputSchema: {
    fields: [
      {
        key: 'teams',
        label: 'Teams', labelKey: 'team_display_name',
        listItems: [
          { key: 'id', label: 'Team ID' },
          { key: 'team_name', label: 'Team Name' },
          { key: 'team_display_name', label: 'Team Display Name' },
          { key: 'info', label: 'Info', format: 'html' },
          { key: 'thumbnail_url', label: 'Thumbnail URL', format: 'image' },
          { key: 'banner', label: 'Banner URL', format: 'image' },
          { key: 'background_image_url', label: 'Background Image URL', format: 'image' },
          { key: 'created_at', label: 'Created At', format: 'datetime' },
          { key: 'updated_at', label: 'Updated At', format: 'datetime' },
          { key: 'broadcaster_id', label: 'Broadcaster ID' },
          { key: 'broadcaster_login', label: 'Broadcaster Login' },
          { key: 'broadcaster_name', label: 'Broadcaster Name' },
        ],
      },
    ],
  },
  async run({ auth, propsValue }) {
    const broadcasterId = await twitchCommon.resolveUserId({ auth, value: propsValue.broadcaster_id });
    const response = await twitchCommon.request<HelixPage<Record<string, unknown>>>({
      auth,
      method: HttpMethod.GET,
      path: '/teams/channel',
      query: { broadcaster_id: broadcasterId },
    });
    return { teams: response.body.data ?? [] };
  },
});
