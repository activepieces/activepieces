export type FloqerUser = {
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
};

export type FloqerWorkflowSummary = {
    workflow_id: string;
    name: string;
    created_at: string;
    updated_at: string;
    last_run_at: string | null;
};

export type FloqerOverviewSheet = {
    sheet_id: string;
    name: string;
    is_main_sheet: boolean;
    auto_run: boolean;
    cache_enabled: boolean;
    cache_since: string | null;
    continue_on_fail: boolean;
    webhook_url: string | null;
};

export type FloqerWorkflowOverview = {
    workflow_id: string;
    name: string;
    sheets: FloqerOverviewSheet[];
    shared_users: string[];
    is_owner: boolean;
};

export type FloqerInputField = {
    reference: string;
    name: string;
    description?: string;
    type?: string;
    required?: boolean;
    defaultValue?: unknown;
};

export type FloqerShortcut = {
    id: string;
    workflow_id: string;
    name: string;
    description?: string;
    input_schema?: FloqerInputField[];
    is_master: boolean;
    is_published: boolean;
};

export type FloqerRowError = {
    field: string;
    code: string;
    message: string;
};

export type FloqerRejectedRow = {
    row: Record<string, unknown>;
    errors: FloqerRowError[];
};

export type FloqerAddRowsResult = {
    row_count: number;
    row_ids: string[];
    rejected: FloqerRejectedRow[];
    rows_queued_for_run: number;
};

export type FloqerRunRowsResult = {
    rows_queued: number;
};

export type FloqerPaginationMeta = {
    total: number;
    limit: number;
    offset: number;
    totalIsLowerBound?: boolean;
};

export type FloqerSegmentSummary = {
    id: string;
    name: string;
    description: string | null;
    entityKind: string;
    isDefault: boolean;
    baseSegmentId: string | null;
};

export type FloqerSegmentChange = {
    seq: number;
    entityId: string;
    kind: 'enter' | 'exit' | 'reenter';
    at: string;
};

export type FloqerSegmentChanges = {
    segmentId: string;
    filterHash: string | null;
    maxSeq: number;
    minRetainedSeq: number;
    changes: FloqerSegmentChange[];
    hasMore: boolean;
    nextSince: number;
    bootstrapped?: boolean;
    reconcile?: boolean;
    reason?: string;
};
