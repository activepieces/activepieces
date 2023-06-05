import { Paste } from "./paste"

export interface Folder {
    id: string,
    name: string,
    user_id: string,
    children: Folder[],
    exists: boolean,
    pastes: Paste[],
    created_at: string
}

export interface FolderCreateRequest {
    name: string
}

export interface FolderCreateResponse {
    success: boolean,
    folder: Folder
}

export interface FolderEditRequest {
    name?: string
}

export interface FolderEditResponse {
    success: boolean,
    folder: Folder
}