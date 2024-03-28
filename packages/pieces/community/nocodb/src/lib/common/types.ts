export interface ListAPIResponse<T> {
	list: T[];
	pageInfo: {
		totalRows: number;
		page: number;
		pageSize: number;
		isFirstPage: boolean;
		isLastPage: boolean;
	};
}

export interface WorkspaceResponse {
	id: string;
	title: string;
	description: string;
	deleted: boolean;
	deleted_at: string;
	status: number;
	order: number;
}

export interface BaseResponse {
	id: string;
	title: string;
	description: string;
	deleted: boolean;
	deleted_at: string;
	status: number;
	order: number;
	type: string;
}

export interface TableResponse {
	id: string;
	source_id: string;
	description: string;
	base_id: string;
	table_name: string;
	title: string;
	type: string;
	deleted_at: string;
	created_at: string;
	updated_at: string;
	order: number;
	enabled: boolean;
}
