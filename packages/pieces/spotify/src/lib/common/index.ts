import { getAccessTokenOrThrow } from '@activepieces/pieces-common'
import { Property, StaticPropsValue } from '@activepieces/pieces-framework'
import { SpotifyWebApi } from './client'

export const spotifyCommon = {
    authentication: Property.OAuth2({
        displayName: 'Authentication',
        description: 'Authenticate with Spotify',
        required: true,
        authUrl: "https://accounts.spotify.com/authorize",
        tokenUrl: "https://accounts.spotify.com/api/token",
        scope: [
            'user-read-playback-state',
            'user-modify-playback-state',
            'user-read-currently-playing',
            'user-read-playback-position',
            'user-read-recently-played',
            'playlist-read-private',
            'playlist-read-collaborative',
            'playlist-modify-private',
            'playlist-modify-public'
        ]
    }),
    device_id: (required = true) => Property.Dropdown({
        displayName: 'Device',
        required,
        refreshers: ['authentication'],
        options: async (value) => {
            if (!value['authentication']) {
                return {
                    disabled: true,
                    placeholder: 'setup authentication first',
                    options: []
                }
            }
            const client = makeClient(value)
            const res = await client.getDevices()
            return {
                disabled: false,
                options: res.devices.map((device) => {
                    return {
                        label: device.name,
                        value: device.id
                    }
                })
            }
        }
    }),
    playlist_id: (required = true) => Property.Dropdown({
        displayName: 'Playlist',
        required,
        refreshers: ['authentication'],
        options: async (value) => {
            if (!value['authentication']) {
                return {
                    disabled: true,
                    placeholder: 'setup authentication first',
                    options: []
                }
            }
            const client = makeClient(value)
            const playlists = await client.getAllCurrentUserPlaylists()
            return {
                disabled: false,
                options: playlists.map((playlist) => {
                    return {
                        label: playlist.name,
                        value: playlist.id
                    }
                })
            }
        }
    })
}

export function makeClient(propsValue: StaticPropsValue<any>): SpotifyWebApi {
    const token = getAccessTokenOrThrow(propsValue.authentication)
    return new SpotifyWebApi(token)
}