export interface ChevronDropdownOption {
	id: string;
	name?: string;
	cssClasses: string;
	type: ChevronDropdownOptionType;
}

export enum ChevronDropdownOptionType {
	NORMAL,
	SEPARATOR,
	COPY_ID,
}
