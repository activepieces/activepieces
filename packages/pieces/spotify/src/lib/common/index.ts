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
            'app-remote-control',
            'streaming',
            'playlist-read-private',
            'playlist-read-collaborative',
            'playlist-modify-private',
            'playlist-modify-public',
            'user-read-playback-position',
            'user-read-recently-played',
            'user-library-modify',
            'user-library-read'
        ]
    })
}

export function makeClient(propsValue: StaticPropsValue<any>): SpotifyWebApi {
    const token = getAccessTokenOrThrow(propsValue.authentication)
    return new SpotifyWebApi(token)
}