export interface HasURI {
  uri: string;
}

export interface SpotifyObject {
  id: string;
  uri: string;
}

export interface Pagination<T> {
  href: string;
  limit: number;
  next: string;
  offset: number;
  previous: string;
  total: number;
  items: T[];
}

export interface PaginationRequest {
  limit?: number;
  offset?: number;
}
