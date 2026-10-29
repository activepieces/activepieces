import { HttpMethod } from "@activepieces/pieces-common";
import { AppConnectionValueForAuthProperty } from "@activepieces/pieces-framework";
import { codaAuth } from '../auth';
import { CODA_BASE_URL, CodaQueryValue, codaApi } from './client';

export { CODA_BASE_URL };

export interface CodaObjectReference {
    id: string;
    type: string;
    href: string;
    name?: string;
}

export interface CodaPageReference extends CodaObjectReference {
    type: 'page';
}

export interface CodaColumnReference extends CodaObjectReference {
    type: 'column';
}

export interface CodaTableReference extends CodaObjectReference {
    type: 'table' | 'view';
    name: string;
}

export interface CodaListTablesResponse {
    items: CodaTableReference[];
    href?: string;
    nextPageToken?: string;
    nextPageLink?: string;
}

export interface CodaSort {
    column: CodaColumnReference | string;
    direction: 'ascending' | 'descending';
}

export interface CodaColumnFormat {
    type: string;
    isArray?:boolean
}

export interface CodaTableColumn {
    id: string;
    type: "column";
    href: string;
    name: string;
    format: CodaColumnFormat;
    display?: boolean;
    calculated?: boolean;
    formula?: string;
    defaultValue?: string;
}

export interface CodaListColumnsResponse {
    items: CodaTableColumn[];
    href?: string;
    nextPageToken?: string;
    nextPageLink?: string;
}

export interface CodaGetTableDetailsResponse {
    id: string;
    type: "table";
    tableType: "table" | "view";
    href: string;
    name: string;
    parent: CodaPageReference;
    browserLink: string;
    displayColumn: CodaColumnReference;
    rowCount: number;
    sorts: CodaSort[];
    layout: string;
    createdAt: string;
    updatedAt: string;
    parentTable?: CodaTableReference;
    filter?: unknown;
}

export interface CodaRow {
    id: string;
    type: "row";
    href: string;
    name: string;
    index: number;
    browserLink: string;
    createdAt: string;
    updatedAt: string;
    values: Record<string, unknown>;
    parentTable?: CodaTableReference;
}

export interface CodaGetRowResponse extends CodaRow {
    parent: CodaTableReference;
}

export interface CodaListRowsResponse {
    items: CodaRow[];
    href?: string;
    nextPageToken?: string;
    nextPageLink?: string;
    nextSyncToken?: string;
}

export interface CodaCellEdit {
    column: string;
    value: unknown;
}
export interface CodaRowEdit {
    cells: CodaCellEdit[];
}

export interface CodaMutateRowsPayload {
    rows: CodaRowEdit[];
    keyColumns?: string[];
}

export interface CodaMutateRowsResponse {
    requestId: string;
    addedRowIds?: string[];
}

export interface CodaUpdateRowPayload {
    row: CodaRowEdit;
}

export interface CodaUpdateRowResponse {
    requestId: string;
    id: string;
}

export interface CodaDocIcon {
    name: string;
    type: string;
    browserLink: string;
}

export interface CodaDocSize {
    totalRowCount: number;
    tableAndViewCount: number;
    pageCount: number;
    overApiSizeLimit: boolean;
}

export interface CodaDocSourceDocReference {
    id: string;
    type: "doc";
    browserLink: string;
    href: string;
}

export interface CodaDocPublished {
    browserLink: string;
    discoverable: boolean;
    earnCredit: boolean;
    mode: "view" | "play" | "edit";
    categories: { name: string }[];
    description?: string;
    imageLink?: string;
}
export interface CodaDoc {
    id: string;
    type: "doc";
    href: string;
    browserLink: string;
    name: string;
    owner: string;
    ownerName: string;
    createdAt: string;
    updatedAt: string;
    workspaceId: string;
    folderId: string;
    workspace: CodaObjectReference;
    folder: CodaObjectReference;
    icon?: CodaDocIcon;
    docSize?: CodaDocSize;
    sourceDoc?: CodaDocSourceDocReference;
    published?: CodaDocPublished;
}

export interface CodaListDocsResponse {
    items: CodaDoc[];
    href?: string;
    nextPageToken?: string;
    nextPageLink?: string;
}

export interface CodaAPIClient {
    listTables: (docId: string, params?: { limit?: number; sortBy?: string; tableTypes?: string, pageToken?: string }) => Promise<CodaListTablesResponse>;
    getTableDetails: (docId: string, tableIdOrName: string, params?: { useUpdatedTableLayouts?: boolean }) => Promise<CodaGetTableDetailsResponse>;
    listColumns: (docId: string, tableIdOrName: string, params?: { limit?: number; pageToken?: string; visibleOnly?: boolean; }) => Promise<CodaListColumnsResponse>;
    getRow: (docId: string, tableIdOrName: string, rowIdOrName: string, params?: { useColumnNames?: boolean; valueFormat?: string }) => Promise<CodaGetRowResponse>;
    listRows: (docId: string, tableIdOrName: string, params?: {
        query?: string;
        sortBy?: string;
        useColumnNames?: boolean;
        valueFormat?: string;
        visibleOnly?: boolean;
        limit?: number;
        pageToken?: string;
        syncToken?: string;
    }) => Promise<CodaListRowsResponse>;
    mutateRows: (docId: string, tableIdOrName: string, payload: CodaMutateRowsPayload, params?: { disableParsing?: boolean }) => Promise<CodaMutateRowsResponse>;
    updateRow: (docId: string, tableIdOrName: string, rowIdOrName: string, payload: CodaUpdateRowPayload, params?: { disableParsing?: boolean }) => Promise<CodaUpdateRowResponse>;
    listDocs: (params?: {
        isOwner?: boolean;
        isPublished?: boolean;
        query?: string;
        sourceDoc?: string;
        isStarred?: boolean;
        inGallery?: boolean;
        workspaceId?: string;
        folderId?: string;
        limit?: number;
        pageToken?: string;
    }) => Promise<CodaListDocsResponse>;
}

export const codaClient = ({ secret_text }: AppConnectionValueForAuthProperty<typeof codaAuth>): CodaAPIClient => {
    const call = <T>({ method, path, operation, query, body }: { method: HttpMethod; path: string; operation: string; query?: Record<string, CodaQueryValue>; body?: unknown }): Promise<T> =>
        codaApi.request<T>({ token: secret_text, method, path, operation, query, body });

    return {
        listTables: (docId, params) =>
            call<CodaListTablesResponse>({
                method: HttpMethod.GET,
                path: `${codaApi.docPath(docId)}/tables`,
                operation: 'list tables',
                query: { ...params },
            }),
        getTableDetails: (docId, tableIdOrName, params) =>
            call<CodaGetTableDetailsResponse>({
                method: HttpMethod.GET,
                path: codaApi.tablePath({ docId, tableIdOrName }),
                operation: 'get table',
                query: { ...params },
            }),
        listColumns: (docId, tableIdOrName, params) =>
            call<CodaListColumnsResponse>({
                method: HttpMethod.GET,
                path: `${codaApi.tablePath({ docId, tableIdOrName })}/columns`,
                operation: 'list columns',
                query: { ...params },
            }),
        getRow: (docId, tableIdOrName, rowIdOrName, params) =>
            call<CodaGetRowResponse>({
                method: HttpMethod.GET,
                path: `${codaApi.tablePath({ docId, tableIdOrName })}/rows/${codaApi.pathSegment({ value: rowIdOrName, label: 'Row ID or name' })}`,
                operation: 'get row',
                query: { ...params },
            }),
        listRows: (docId, tableIdOrName, params) =>
            call<CodaListRowsResponse>({
                method: HttpMethod.GET,
                path: `${codaApi.tablePath({ docId, tableIdOrName })}/rows`,
                operation: 'list rows',
                query: { ...params },
            }),
        mutateRows: (docId, tableIdOrName, payload, params) =>
            call<CodaMutateRowsResponse>({
                method: HttpMethod.POST,
                path: `${codaApi.tablePath({ docId, tableIdOrName })}/rows`,
                operation: 'add or update rows',
                query: { ...params },
                body: payload,
            }),
        updateRow: (docId, tableIdOrName, rowIdOrName, payload, params) =>
            call<CodaUpdateRowResponse>({
                method: HttpMethod.PUT,
                path: `${codaApi.tablePath({ docId, tableIdOrName })}/rows/${codaApi.pathSegment({ value: rowIdOrName, label: 'Row ID or name' })}`,
                operation: 'update row',
                query: { ...params },
                body: payload,
            }),
        listDocs: (params) =>
            call<CodaListDocsResponse>({
                method: HttpMethod.GET,
                path: '/docs',
                operation: 'list docs',
                query: { ...params },
            }),
    };
};
