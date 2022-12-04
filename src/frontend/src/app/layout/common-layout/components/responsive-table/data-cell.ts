export interface DataCell {
	icon?: string;
	faIcon?: any;
	align?: string;
	route?: { route: string; extra: any };
	onHover?: boolean;
	content: string;
	actionToReturn?: string;
}
