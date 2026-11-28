import { Artist } from './artist';
import { Track } from './track';
import { Album } from './album';
import { Playlist } from './playlist';
import { Pagination } from './common';
import { Episode, Show } from './catalog';

export interface SearchResult {
  tracks?: Pagination<Track | null>;
  artists?: Pagination<Artist | null>;
  playlists?: Pagination<Playlist | null>;
  albums?: Pagination<Album | null>;
  shows?: Pagination<Show | null>;
  episodes?: Pagination<Episode | null>;
}

export interface SearchRequest {
  q: string;
  type: string;
  market?: string;
  limit?: number;
  offset?: number;
  include_external?: string;
}
