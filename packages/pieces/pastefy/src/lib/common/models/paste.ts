export enum PasteType {
    PASTE = 'PASTE',
    MULTI_PASTE = 'MULTI_PASTE'
}

export enum PasteVisibility {
    PUBLIC = 'PUBLIC',
    UNLISTED = 'UNLISTED',
    PRIVATE = 'PRIVATE'
}

export interface Paste {
    id: string,
    type: PasteType,
    title: string,
    content: string,
    encrypted: boolean,
    exists: boolean,
    raw_url: string,
    created_at: string,
    expire_at?: string,
    user_id?: string
}

export interface PasteCreateRequest {
    title: string,
    content: string,
    type?: PasteType,
    visibility?: PasteVisibility,
    encrypted?: boolean,
    expire_at?: string
}

export interface PasteCreateResponse {
    success: boolean,
    paste: Paste
}

export interface PasteEditRequest {
    title?: string,
    content?: string,
    type?: PasteType,
    visibility?: PasteVisibility,
    encrypted?: boolean,
    expire_at?: string
}

export interface PasteEditResponse {
    success: boolean,
    paste: Paste
}

export interface PasteListRequest {
    page?: number,
    page_size?: number,
    search?: string,
    shorten_content?: boolean
}

export interface PasteListTrendingRequest {
    page?: number,
    page_size?: number,
    trending?: boolean,
    shorten_content?: boolean
}