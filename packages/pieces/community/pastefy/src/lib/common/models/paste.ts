import { ActionResponse } from './common';

export enum PasteType {
  PASTE = 'PASTE',
  MULTI_PASTE = 'MULTI_PASTE',
}

export enum PasteVisibility {
  PUBLIC = 'PUBLIC',
  UNLISTED = 'UNLISTED',
  PRIVATE = 'PRIVATE',
}

export interface Paste {
  exists: boolean;
  id: string;
  content: string;
  title: string;
  encrypted: boolean;
  folder: string;
  user_id?: string;
  visibility: PasteVisibility;
  forked_from?: string;
  raw_url: string;
  type: PasteType;
  created_at: string;
  expire_at?: string;
}

export interface PasteCreateRequest {
  title?: string;
  content: string;
  encrypted?: boolean;
  folder?: string;
  expire_at?: string;
  forked_from?: string;
  visibility?: PasteVisibility;
  type?: PasteType;
}

export interface PasteCreateResponse extends ActionResponse {
  paste: Paste;
}

export interface PasteEditRequest {
  title?: string;
  content?: string;
  encrypted?: boolean;
  folder?: string;
  type?: PasteType;
  visibility?: PasteVisibility;
  expire_at?: string;
}

export interface PasteEditResponse extends ActionResponse {
  paste: Paste;
}

export interface PasteShareRequest {
  friend: string;
}

export interface PasteListRequest {
  page?: number;
  page_size?: number;
  search?: string;
  shorten_content?: boolean;
}

export interface PasteListTrendingRequest {
  page?: number;
  page_size?: number;
  trending?: boolean;
  shorten_content?: boolean;
}
