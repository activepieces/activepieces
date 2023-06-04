import { Artist } from "./artist"
import { Track } from "./track"
import { Album } from "./album"
import { Playlist } from "./playlist"

export interface SearchResultType<T> {
    limit: number,
    offset: number,
    total: number,
    items: T[]
}

export interface SearchResult {
    tracks?: SearchResultType<Track>,
    artists?: SearchResultType<Artist>,
    playlists?: SearchResultType<Playlist>,
    albums?: SearchResultType<Album>
}

export interface SearchRequest {
    q: string,
    type: string,
    market?: string,
    limit?: number,
    offset?: number,
    include_external?: string
}