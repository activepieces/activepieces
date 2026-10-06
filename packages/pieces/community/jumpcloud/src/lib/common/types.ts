export type ApiVersion = 'v1' | 'v2';

export type ConnectionProps = {
    apiKey: string;
    region?: string;
    orgId?: string;
};

export type ApiRecord = Record<string, unknown>;

export type ListPage = {
    items: ApiRecord[];
    totalCount?: number;
};

export type PageRequest = {
    limit: number;
    skip: number;
};

export type CollectedPage = {
    items: ApiRecord[];
    total_count: number | null;
    next_skip: number | null;
};

export type ObjectTypeKey = 'user' | 'system' | 'user_group' | 'system_group' | 'application';

export type ObjectSearch =
    | { kind: 'endpoint'; path: string; fields: string[] }
    | { kind: 'filter'; field: string; operator: string }
    | { kind: 'local' };

export type ObjectTypeConfig = {
    label: string;
    version: ApiVersion;
    path: string;
    idField: '_id' | 'id';
    defaultSort: string;
    canCreate: boolean;
    replaceOnUpdate: boolean;
    search: ObjectSearch;
};

export type PageWindow = {
    start: number;
    count: number;
};

export type PaginationInput = {
    skip?: number;
    limit?: number;
    fetchAll?: boolean;
    maxItems?: number;
};

export type FlatObject = Record<string, string | number | boolean | null>;
