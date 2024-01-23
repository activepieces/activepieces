import { ActionResponse, ListRequest } from './common';
import { Paste } from './paste';

export interface Folder {
  exists: boolean;
  id: string;
  name: string;
  user_id: string;
  children?: Folder[];
  pastes?: Paste[];
  created: string;
}

export interface FolderCreateRequest {
  name: string;
  parent?: string;
}

export interface FolderCreateResponse extends ActionResponse {
  folder: Folder;
}

export interface FolderEditRequest {
  name?: string;
}

export interface FolderEditResponse extends ActionResponse {
  folder: Folder;
}

export interface FolderGetRequest {
  hide_children?: string;
}

export interface FolderListRequest extends ListRequest {
  user_id?: string;
}

export interface FolderHierarchy {
  id: string;
  name: string;
  children: FolderHierarchy[];
}
