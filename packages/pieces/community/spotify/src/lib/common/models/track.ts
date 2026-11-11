import { Album } from './album';
import { Artist } from './artist';

export interface Track {
  id: string | null;
  name: string;
  uri: string;
  type?: 'track';
  duration_ms?: number;
  explicit?: boolean;
  is_local?: boolean;
  track_number?: number;
  disc_number?: number;
  album?: Album;
  artists?: Artist[];
  external_urls?: { spotify?: string };
}
