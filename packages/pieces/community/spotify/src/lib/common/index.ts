import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { SpotifyWebApi } from './client';

const markdownDescription = `
To obtain a client ID and client secret for Spotify, follow these simple steps:

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/).
2. **Log in** to your Spotify account.
3. Click on the **"Create an App"** button.
4. Fill in the required information, such as the **App Name** and **App Description**.
5. Once your app is created, you will see the **client ID** and **client secret** on the app's dashboard.
6. **Copy** the client ID and client secret and **paste** them below.
`;

export const spotifyCommon = {
  authentication: PieceAuth.OAuth2({
    description: markdownDescription,
    required: true,
    authUrl: 'https://accounts.spotify.com/authorize',
    tokenUrl: 'https://accounts.spotify.com/api/token',
    scope: [
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'user-read-playback-position',
      'user-read-recently-played',
      'playlist-read-private',
      'playlist-read-collaborative',
      'playlist-modify-private',
      'playlist-modify-public',
      'user-library-read',
    ],
  }),
  device_id: (required = true) =>
    Property.Dropdown({
      displayName: 'Device',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'setup authentication first',
            options: [],
          };
        }
        const client = makeClient({
          auth: auth as OAuth2PropertyValue,
        });
        const res = await client.getDevices();
        return {
          disabled: false,
          options: res.devices.map((device) => {
            return {
              label: device.name,
              value: device.id,
            };
          }),
        };
      },
    }),
  playlist_id: (required = true) =>
    Property.Dropdown({
      displayName: 'Playlist',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'setup authentication first',
            options: [],
          };
        }
        const client = makeClient({
          auth: auth as OAuth2PropertyValue,
        });
        const playlists = await client.getAllCurrentUserPlaylists();
        return {
          disabled: false,
          options: playlists.map((playlist) => {
            return {
              label: playlist.name,
              value: playlist.id,
            };
          }),
        };
      },
    }),
};

export function makeClient(propsValue: {
  auth: OAuth2PropertyValue;
}): SpotifyWebApi {
  const token = getAccessTokenOrThrow(propsValue.auth);
  return new SpotifyWebApi(token);
}
