export interface HasURI {
  uri: string;
}

export interface SpotifyObject {
  id: string;
  uri: string;
}

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface Pagination<T> {
  href: string;
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
  items: T[];
}

export interface CursorPagination<T> {
  href: string;
  limit: number;
  next: string | null;
  cursors: { after?: string | null; before?: string | null } | null;
  total?: number;
  items: T[];
}

export interface PaginationRequest {
  limit?: number;
  offset?: number;
}

export interface SnapshotResponse {
  snapshot_id: string;
}
