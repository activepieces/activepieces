import { Artist } from './artist';
import { Track } from './track';
import { Album } from './album';
import { Playlist } from './playlist';
import { Pagination } from './common';

export interface SearchResult {
  tracks?: Pagination<Track>;
  artists?: Pagination<Artist>;
  playlists?: Pagination<Playlist>;
  albums?: Pagination<Album>;
}

export interface SearchRequest {
  q: string;
  type: string;
  market?: string;
  limit?: number;
  offset?: number;
  include_external?: string;
}
