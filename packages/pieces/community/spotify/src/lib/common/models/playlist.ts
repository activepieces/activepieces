import { HasURI, Pagination, SpotifyImage } from './common';
import { Episode } from './catalog';
import { Track } from './track';
import { User } from './user';

export interface PlaylistItem {
  added_at: string | null;
  added_by?: User | null;
  is_local: boolean;
  item?: Track | Episode | null;
  track?: Track | Episode | null;
}

export interface Playlist {
  id: string;
  name: string;
  type: 'playlist';
  uri: string;
  owner?: User;
  description?: string | null;
  public?: boolean | null;
  collaborative?: boolean;
  snapshot_id?: string;
  images?: SpotifyImage[] | null;
  external_urls?: { spotify?: string };
  items?: Pagination<PlaylistItem> | { href?: string; total?: number; items?: PlaylistItem[] };
  tracks?: Pagination<PlaylistItem> | { href?: string; total?: number; items?: PlaylistItem[] };
}

export interface PlaylistCreateRequest {
  name: string;
  public?: boolean;
  collaborative?: boolean;
  description?: string;
}

export interface PlaylistAddItemsRequest {
  uris: string[];
  position?: number;
}

export interface PlaylistRemoveItemsRequest {
  items: HasURI[];
  snapshot_id?: string;
}

export interface PlaylistReorderItemsRequest {
  range_start: number;
  range_length?: number;
  insert_before: number;
  snapshot_id?: string;
}

export interface PlaylistUpdateRequest {
  name?: string;
  public?: boolean;
  collaborative?: boolean;
  description?: string;
}
