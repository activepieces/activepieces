import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon } from '../common';

export const getTeam = createAction({
  auth: twitchAuth,
  name: 'get_team',
  displayName: 'Get Team',
  description: 'Get a Twitch team and its members by name or ID.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Get one Twitch team by its name (the URL slug, for example "staff") or its numeric ID; give exactly one. Returns the team (id, team_name, team_display_name, info, thumbnail_url, banner, background_image_url, created_at, updated_at) and users[] (user_id, user_login, user_name). Fails with Twitch\'s 404 when the team does not exist.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Team Name',
      description: 'The team slug, for example staff.',
      required: false,
    }),
    id: Property.ShortText({
      displayName: 'Team ID',
      required: false,
    }),
  },
  outputSchema: {
    fields: [
      { key: 'id', label: 'Team ID' },
      { key: 'team_name', label: 'Team Name' },
      { key: 'team_display_name', label: 'Team Display Name' },
      { key: 'info', label: 'Info', format: 'html' },
      { key: 'thumbnail_url', label: 'Thumbnail URL', format: 'image' },
      { key: 'banner', label: 'Banner URL', format: 'image' },
      { key: 'background_image_url', label: 'Background Image URL', format: 'image' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
      { key: 'updated_at', label: 'Updated At', format: 'datetime' },
      {
        key: 'users',
        label: 'Members', labelKey: 'user_name',
        listItems: twitchCommon.userFields,
      },
    ],
  },
  async run({ auth, propsValue }) {
    const name = twitchCommon.optionalText(propsValue.name);
    const id = twitchCommon.optionalText(propsValue.id);
    if ((name === undefined) === (id === undefined)) {
      throw new Error('Provide exactly one of Team Name or Team ID.');
    }
    const response = await twitchCommon.request<HelixPage<Record<string, unknown>>>({
      auth,
      method: HttpMethod.GET,
      path: '/teams',
      query: { name, id },
    });
    return twitchCommon.firstItem({ page: response.body, label: 'team' });
  },
});
