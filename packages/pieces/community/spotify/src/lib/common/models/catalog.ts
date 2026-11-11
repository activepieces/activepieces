import { CursorPagination, SpotifyImage } from './common';
import { Track } from './track';

export interface Show {
  id: string;
  name: string;
  uri: string;
  type?: 'show';
  description?: string;
  total_episodes?: number;
  media_type?: string;
  explicit?: boolean;
  images?: SpotifyImage[];
  external_urls?: { spotify?: string };
}

export interface Episode {
  id: string;
  name: string;
  uri: string;
  type?: 'episode';
  description?: string;
  duration_ms?: number;
  release_date?: string;
  explicit?: boolean;
  images?: SpotifyImage[];
  show?: Show;
  external_urls?: { spotify?: string };
}

export interface QueueResponse {
  currently_playing: Track | Episode | null;
  queue: (Track | Episode)[];
}

export interface PlayHistory {
  played_at: string;
  track: Track;
  context: { type: string; uri: string; href?: string } | null;
}

export type RecentlyPlayedResponse = CursorPagination<PlayHistory>;
