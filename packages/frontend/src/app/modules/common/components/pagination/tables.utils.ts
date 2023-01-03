export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZES = [5, 10, 20];
export function copyText(str: string) {
	navigator.clipboard.writeText(str);
}
export interface PaginationParams {
	cursor?: string;
	pageSize: number;
}
