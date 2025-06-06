import { HttpMethod, httpClient, HttpRequest, AuthenticationType } from "@activepieces/pieces-common";

export const CODA_BASE_URL = "https://coda.io/apis/v1";

// --- Common Reference Types ---
export interface CodaObjectReference {
    id: string;
    type: string;
    href: string;
    name?: string; // Common but not always present in all reference types
}

export interface CodaPageReference extends CodaObjectReference {
    type: 'page'; // More specific type if known
    // Add other page-specific reference fields if needed
}

export interface CodaColumnReference extends CodaObjectReference {
    type: 'column'; // More specific type if known
    // Add other column-specific reference fields if needed
}

// --- Table Related Interfaces ---
export interface CodaTableReference extends CodaObjectReference {
    type: 'table' | 'view'; // More specific, can be table or view reference
    name: string; // Name is required for table reference as per GetTable response
}

export interface CodaListTablesResponse {
    items: CodaTableReference[];
    href?: string;
    nextPageToken?: string;
    nextPageLink?: string;
}

export interface CodaSort {
    column: CodaColumnReference | string; // API might return ID or full reference
    direction: 'ascending' | 'descending';
}

// Interface for the format of a column
export interface CodaColumnFormat {
    type: string; // e.g., "text", "number", "date", "person", "lookup", "checkbox", "currency", "percent", "slider", "scale", "selectList", "multiSelectList", "button"
    // Other format-specific properties can be added here if needed for dynamic prop generation
    // For example, for selectList:
    // options?: { name: string, id?: string }[];
    // For lookup:
    // table?: CodaTableReference;
    isArray?:boolean
}

// Interface for a single column in the getTableDetails response
export interface CodaTableColumn {
    id: string; // Column ID, e.g., "c-123abcDEF"
    type: "column";
    href: string;
    name: string; // User-visible name of the column
    format: CodaColumnFormat;
    display?: boolean; // As per docs, optional
    calculated?: boolean; // Whether this is a calculated column
    formula?: string; // The formula if it's a calculated column
    defaultValue?: string; // As per docs, it's a formula string
    // Add other relevant column properties if necessary
}

export interface CodaListColumnsResponse {
    items: CodaTableColumn[];
    href?: string;
    nextPageToken?: string;
    nextPageLink?: string;
}

export interface CodaGetTableDetailsResponse {
    id: string;
    type: "table"; // This specific endpoint returns "table"
    tableType: "table" | "view";
    href: string;
    name: string;
    parent: CodaPageReference;
    browserLink: string;
    displayColumn: CodaColumnReference; // This is a reference, not the full column object
    rowCount: number;
    sorts: CodaSort[];
    layout: string; // Enum of layout types, string for simplicity
    createdAt: string; // date-time
    updatedAt: string; // date-time
    parentTable?: CodaTableReference; // Optional, for views
    filter?: any; // object, structure can be complex
}


// --- Row Related Interfaces ---
export interface CodaRow {
    id: string;
    type: "row";
    href: string;
    name: string;
    index: number;
    browserLink: string;
    createdAt: string;
    updatedAt: string;
    values: Record<string, any>;
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

// For creating/updating rows
export interface CodaCellEdit {
    column: string; // Column ID or Name
    value: any;
}
export interface CodaRowEdit {
    cells: CodaCellEdit[];
}

export interface CodaMutateRowsPayload {
    rows: CodaRowEdit[];
    keyColumns?: string[]; // Column IDs or Names for upsert
}

export interface CodaMutateRowsResponse {
    requestId: string;
    addedRowIds?: string[];
    updatedRowIds?: string[]; // API docs for POST say addedRowIds, but PUT might have updatedRowIds. Let's be broad.
}

export interface CodaUpdateRowPayload { // Used for PUT (update single row)
    row: CodaRowEdit;
}

export interface CodaUpdateRowResponse {
    requestId: string;
    id: string; // ID of the updated row
}

// --- Document Related Interfaces ---
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
    categories: { name: string }[]; // Simplified, assuming only name is needed for now
    description?: string;
    imageLink?: string;
}
export interface CodaDoc {
    id: string;
    type: "doc";
    href: string;
    browserLink: string;
    name: string;
    owner: string; // email
    ownerName: string;
    createdAt: string; // date-time
    updatedAt: string; // date-time
    workspaceId: string; // Deprecated but present
    folderId: string; // Deprecated but present
    workspace: CodaObjectReference; // WorkspaceReference
    folder: CodaObjectReference; // FolderReference
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

// --- API Client ---
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

export const codaClient = (apiKey: string): CodaAPIClient => {
    const makeRequest = async <T>(request: Omit<HttpRequest, 'authentication'> & { body?: any }): Promise<T> => {
        const response = await httpClient.sendRequest<T>({
            ...request,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: apiKey,
            }
        });
        return response.body;
    }

    return {
        listTables: async (docId, params) => {
            const queryParams: Record<string, string | number | boolean> = {};
            if (params?.limit) queryParams['limit'] = params.limit.toString();
            if (params?.sortBy) queryParams['sortBy'] = params.sortBy;
            if (params?.tableTypes) queryParams['tableTypes'] = params.tableTypes;
            if (params?.pageToken) queryParams['pageToken'] = params.pageToken;

            return makeRequest<CodaListTablesResponse>({
                method: HttpMethod.GET,
                url: `${CODA_BASE_URL}/docs/${docId}/tables`,
                queryParams: Object.fromEntries(Object.entries(queryParams).map(([k, v]) => [k, String(v)])),
            });
        },
        getTableDetails: async (docId, tableIdOrName, params) => {
            const queryParams: Record<string, string | boolean> = {};
            if (params?.useUpdatedTableLayouts !== undefined) queryParams['useUpdatedTableLayouts'] = params.useUpdatedTableLayouts;

            return makeRequest<CodaGetTableDetailsResponse>({
                method: HttpMethod.GET,
                url: `${CODA_BASE_URL}/docs/${docId}/tables/${encodeURIComponent(tableIdOrName)}`,
                queryParams: Object.fromEntries(Object.entries(queryParams).map(([k, v]) => [k, String(v)])),
            });
        },
        listColumns: async (docId, tableIdOrName, params) => {
            const queryParams: Record<string, string | number | boolean> = {};
            if (params?.limit) queryParams['limit'] = params.limit;
            if (params?.pageToken) queryParams['pageToken'] = params.pageToken;
            if (params?.visibleOnly !== undefined) queryParams['visibleOnly'] = params.visibleOnly;

            return makeRequest<CodaListColumnsResponse>({
                method: HttpMethod.GET,
                url: `${CODA_BASE_URL}/docs/${docId}/tables/${encodeURIComponent(tableIdOrName)}/columns`,
                queryParams: Object.fromEntries(Object.entries(queryParams).map(([k,v])=>[k,String(v)])),
            });
        },
        getRow: async (docId, tableIdOrName, rowIdOrName, params) => {
            const queryParams: Record<string, string | boolean> = {};
            if (params?.useColumnNames !== undefined) queryParams['useColumnNames'] = params.useColumnNames;
            if (params?.valueFormat) queryParams['valueFormat'] = params.valueFormat;

            return makeRequest<CodaGetRowResponse>({
                method: HttpMethod.GET,
                url: `${CODA_BASE_URL}/docs/${docId}/tables/${encodeURIComponent(tableIdOrName)}/rows/${encodeURIComponent(rowIdOrName)}`,
                queryParams: Object.fromEntries(Object.entries(queryParams).map(([k, v]) => [k, String(v)])),
            });
        },
        listRows: async (docId, tableIdOrName, params) => {
            const queryParams: Record<string, string | number | boolean> = {};
            if (params?.query) queryParams['query'] = params.query;
            if (params?.sortBy) queryParams['sortBy'] = params.sortBy;
            if (params?.useColumnNames !== undefined) queryParams['useColumnNames'] = params.useColumnNames;
            if (params?.valueFormat) queryParams['valueFormat'] = params.valueFormat;
            if (params?.visibleOnly !== undefined) queryParams['visibleOnly'] = params.visibleOnly;
            if (params?.limit) queryParams['limit'] = params.limit;
            if (params?.pageToken) queryParams['pageToken'] = params.pageToken;
            if (params?.syncToken) queryParams['syncToken'] = params.syncToken;

            return makeRequest<CodaListRowsResponse>({
                method: HttpMethod.GET,
                url: `${CODA_BASE_URL}/docs/${docId}/tables/${encodeURIComponent(tableIdOrName)}/rows`,
                queryParams: Object.fromEntries(
                    Object.entries(queryParams).map(([key, value]) => [key, String(value)])
                ),
            });
        },
        mutateRows: async (docId, tableIdOrName, payload, params) => {
            const queryParams: Record<string, string | boolean> = {};
            if (params?.disableParsing !== undefined) queryParams['disableParsing'] = params.disableParsing;

            return makeRequest<CodaMutateRowsResponse>({
                method: HttpMethod.POST,
                url: `${CODA_BASE_URL}/docs/${docId}/tables/${encodeURIComponent(tableIdOrName)}/rows`,
                body: payload,
                queryParams: Object.fromEntries(Object.entries(queryParams).map(([k, v]) => [k, String(v)])),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        },
        updateRow: async (docId, tableIdOrName, rowIdOrName, payload, params) => {
            const queryParams: Record<string, string | boolean> = {};
            if (params?.disableParsing !== undefined) queryParams['disableParsing'] = params.disableParsing;

            return makeRequest<CodaUpdateRowResponse>({
                method: HttpMethod.PUT,
                url: `${CODA_BASE_URL}/docs/${docId}/tables/${encodeURIComponent(tableIdOrName)}/rows/${encodeURIComponent(rowIdOrName)}`,
                body: payload,
                queryParams: Object.fromEntries(Object.entries(queryParams).map(([k, v]) => [k, String(v)])),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        },
        listDocs: async (params) => {
            const queryParams: Record<string, string | number | boolean> = {};
            if (params?.isOwner !== undefined) queryParams['isOwner'] = params.isOwner;
            if (params?.isPublished !== undefined) queryParams['isPublished'] = params.isPublished;
            if (params?.query) queryParams['query'] = params.query;
            if (params?.sourceDoc) queryParams['sourceDoc'] = params.sourceDoc;
            if (params?.isStarred !== undefined) queryParams['isStarred'] = params.isStarred;
            if (params?.inGallery !== undefined) queryParams['inGallery'] = params.inGallery;
            if (params?.workspaceId) queryParams['workspaceId'] = params.workspaceId;
            if (params?.folderId) queryParams['folderId'] = params.folderId;
            if (params?.limit) queryParams['limit'] = params.limit;
            if (params?.pageToken) queryParams['pageToken'] = params.pageToken;

            return makeRequest<CodaListDocsResponse>({
                method: HttpMethod.GET,
                url: `${CODA_BASE_URL}/docs`,
                queryParams: Object.fromEntries(
                    Object.entries(queryParams).map(([key, value]) => [key, String(value)])
                ),
            });
        }
    };
};
