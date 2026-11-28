import { Artist } from './artist';
import { Pagination, SpotifyImage } from './common';
import { Track } from './track';

export interface Album {
  id: string;
  name: string;
  uri: string;
  type?: 'album';
  album_type?: string;
  total_tracks?: number;
  release_date?: string;
  release_date_precision?: string;
  images?: SpotifyImage[];
  artists?: Artist[];
  external_urls?: { spotify?: string };
  tracks?: Pagination<Track>;
}
