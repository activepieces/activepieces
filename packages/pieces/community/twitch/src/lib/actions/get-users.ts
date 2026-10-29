import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon, TwitchUser } from '../common';

export const getUsers = createAction({
  auth: twitchAuth,
  name: 'get_users',
  displayName: 'Get Users',
  description: 'Get Twitch user profiles by username or user ID. Leave both empty to get your own profile.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Look up Twitch user profiles by login name and/or numeric user ID (up to 100 combined). Leave both lists empty to return the profile of the connected account. Use it to turn a username or channel URL into the user ID that other Twitch actions need (broadcaster_id, user_id). Returns users[] with id, login, display_name, type, broadcaster_type, description, profile_image_url, offline_image_url and created_at. Unknown names are silently omitted by Twitch.',
    idempotent: true,
  },
  props: {
    logins: Property.Array({
      displayName: 'Usernames or Channel URLs',
      description: 'For example loltyler1 or https://twitch.tv/faker.',
      required: false,
    }),
    ids: Property.Array({
      displayName: 'User IDs',
      description: 'Numeric Twitch user IDs.',
      required: false,
    }),
  },
  outputSchema: {
    fields: [
      {
        key: 'users',
        label: 'Users',
        labelKey: 'display_name',
        listItems: [
          { key: 'id', label: 'User ID' },
          { key: 'login', label: 'Login' },
          { key: 'display_name', label: 'Display Name' },
          { key: 'type', label: 'Type' },
          { key: 'broadcaster_type', label: 'Broadcaster Type' },
          { key: 'description', label: 'Description' },
          { key: 'profile_image_url', label: 'Profile Image URL', format: 'image' },
          { key: 'offline_image_url', label: 'Offline Image URL', format: 'image' },
          { key: 'created_at', label: 'Created At', format: 'datetime' },
        ],
      },
    ],
  },
  async run({ auth, propsValue }) {
    const logins = twitchCommon.normalizeLogins(propsValue.logins ?? []);
    const ids = twitchCommon.toStringList(propsValue.ids);
    if (logins.length + ids.length > 100) {
      throw new Error('Twitch accepts at most 100 usernames and user IDs combined.');
    }
    const response = await twitchCommon.request<HelixPage<TwitchUser>>({
      auth,
      method: HttpMethod.GET,
      path: '/users',
      query: {
        login: logins.length > 0 ? logins : undefined,
        id: ids.length > 0 ? ids : undefined,
      },
    });
    return {
      users: (response.body.data ?? []).map((item) => twitchCommon.omitKeys({ item, keys: ['view_count'] })),
    };
  },
});
