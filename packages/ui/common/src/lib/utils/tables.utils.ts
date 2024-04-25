export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZES = [5, 10, 20];
export function copyText(str: string) {
  navigator.clipboard.writeText(str);
}
export interface PaginationParams {
  cursor?: string;
  pageSize: number;
}

export const LIMIT_QUERY_PARAM = 'limit';
export const CURSOR_QUERY_PARAM = 'cursor';
export const FOLDER_QUERY_PARAM = 'folderId';
export const STATUS_QUERY_PARAM = 'status';
export const PREVIOUS_QUERY_PARAM = 'previous';
export const NEXT_QUERY_PARAM = 'next';
export const FLOW_QUERY_PARAM = 'flowId';
export const CONNECTION_NAME_QUERY_PARAM = 'connectionName';
export const PIECE_NAME_QUERY_PARAM = 'pieceName';
export const DATE_RANGE_START_QUERY_PARAM = 'createdAfter';
export const DATE_RANGE_END_QUERY_PARAM = 'createdBefore';
