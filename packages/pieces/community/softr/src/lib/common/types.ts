export interface TableField {
	id: string;
	name: string;
	type: string;
	readonly: boolean;
	allowMultipleEntries: boolean;
	description?: string | null;
	required?: boolean;
	locked?: boolean;
	defaultValue?: string | null;
	options?: {
		choices?: { id: string; label: string }[];
	};
}

export interface SoftrTable {
	id: string;
	name: string;
	description?: string | null;
	primaryFieldId?: string;
	defaultViewId?: string;
	fields: TableField[];
	createdAt?: string;
	updatedAt?: string;
}

export interface SoftrDatabase {
	id: string;
	name: string;
	description?: string | null;
	workspaceId?: string;
	tablesCount?: number;
	createdAt?: string;
	updatedAt?: string;
}

export interface SoftrTableView {
	id: string;
	tableId: string;
	name: string;
	description?: string | null;
	createdAt?: string;
	updatedAt?: string;
}

export interface SoftrRecord {
	id: string;
	tableId?: string;
	createdAt: string;
	updatedAt: string;
	fields: Record<string, unknown>;
}

export interface SoftrListMetadata {
	offset: number;
	limit: number;
	total: number;
}

export interface SoftrSingleResponse<T> {
	data: T;
}

export interface SoftrListResponse<T> {
	data: T[];
	metadata?: SoftrListMetadata | null;
}
