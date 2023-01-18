export interface DropdownItem {
	label: any;
	value: any;
}

export interface ConnectionDropdownItem {
	label: { appName: string | null; name: string };
	value: string;
}
