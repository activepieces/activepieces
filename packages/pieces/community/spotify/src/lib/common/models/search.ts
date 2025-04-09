import { Album } from './album'
import { Artist } from './artist'
import { Pagination } from './common'
import { Playlist } from './playlist'
import { Track } from './track'

export interface SearchResult {
  tracks?: Pagination<Track>
  artists?: Pagination<Artist>
  playlists?: Pagination<Playlist>
  albums?: Pagination<Album>
}

export interface SearchRequest {
  q: string
  type: string
  market?: string
  limit?: number
  offset?: number
  include_external?: string
}
