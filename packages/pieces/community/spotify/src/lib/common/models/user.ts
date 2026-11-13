import { SpotifyImage } from './common';

export enum Product {
  OPEN = 'open',
  FREE = 'free',
  PREMIUM = 'premium',
}

export interface User {
  id: string;
  email?: string;
  display_name: string | null;
  product?: Product;
  type: 'user';
  uri: string;
  account_id?: string;
  images?: SpotifyImage[];
  external_urls?: { spotify?: string };
}
