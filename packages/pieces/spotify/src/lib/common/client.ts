import { AuthenticationType, HttpMessageBody, HttpMethod, QueryParams, httpClient } from "@activepieces/pieces-common"
import { SearchRequest, SearchResult } from "./models/search"
import { PlaybackPlayRequest, PlaybackSeekRequest, PlaybackState, PlaybackVolumeRequest } from "./models/playback"

function emptyValueFilter(accessor: (key: string) => any): (key: string) => boolean {
    return (key: string) => {
        const val = accessor(key)
        return val !== null && val !== undefined && ((typeof val != 'string') || val.length > 0)
    }
}

export function prepareQuery(request: Record<string, any>): QueryParams {
    const params: QueryParams = {}
    Object.keys(request).filter(emptyValueFilter(k => request[k])).forEach((k: string) => {
        params[k] = (request as Record<string, any>)[k].toString()
    })
    return params
}

export class SpotifyWebApi {

    constructor(private accessToken: string) {}

    async makeRequest<T extends HttpMessageBody>(method: HttpMethod, url: string, query?: QueryParams, body?: object): Promise<T> {
        const res = await httpClient.sendRequest<T>({
            method,
            url: 'https://api.spotify.com/v1' + url,
            queryParams: query,
            body,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: this.accessToken
            }
        })
        return res.body
    }

    async search(request: SearchRequest): Promise<SearchResult> {
        const res = await this.makeRequest<SearchResult>(HttpMethod.GET, '/search', prepareQuery(request))
        return res
    }

    async getPlaybackState(): Promise<PlaybackState> {
        return await this.makeRequest<PlaybackState>(HttpMethod.GET, '/me/player')
    }

    async setVolume(request: PlaybackVolumeRequest) {
        await this.makeRequest(HttpMethod.PUT, '/me/player/volume', prepareQuery(request))
    }

    async pause() {
        await this.makeRequest(HttpMethod.PUT, '/me/player/pause')
    }

    async play(request: PlaybackPlayRequest) {
        const query: QueryParams = {}
        if(request.device_id)
            query.device_id = request.device_id
        request.device_id = undefined
        await this.makeRequest(HttpMethod.PUT, '/me/player/play', query, request);
    }

    async seek(request: PlaybackSeekRequest) {
        await this.makeRequest(HttpMethod.PUT, '/me/player/seek', prepareQuery(request))
    }

}