export interface TableField {
	id: string;
	name: string;
	type: string;
	readonly: boolean;
	allowMultipleEntries: boolean;
	options: {
		choices?: { id: string; label: string }[];
	};
}
