import { SpotifyImage } from './common';

export interface Artist {
  id: string;
  name: string;
  type: 'artist';
  uri: string;
  genres?: string[];
  images?: SpotifyImage[];
  external_urls?: { spotify?: string };
}
