import { HasURI } from './common';
import { Track } from './track';
import { User } from './user';

export interface PlaylistItem {
  added_at: string;
  added_by?: User;
  is_local: boolean;
  track: Track;
}

export interface Playlist {
  id: string;
  name: string;
  type: 'playlist';
  uri: string;
  owner?: User;
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
  tracks: HasURI[];
}

export interface PlaylistReorderItemsRequest {
  range_start: number;
  range_length?: number;
  insert_before: number;
}

export interface PlaylistUpdateRequest {
  name?: string;
  public?: boolean;
  collaborative?: boolean;
  description?: string;
}
