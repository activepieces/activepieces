import { SmartSuiteTable, TableStucture } from '.';

function summarize(table: SmartSuiteTable): TableSummary {
	return {
		id: table.id,
		name: table.name,
		slug: table.slug ?? null,
		solution: table.solution ?? null,
		status: table.status ?? null,
		primary_field: table.primary_field ?? null,
		fields_count: Array.isArray(table.structure) ? table.structure.length : null,
	};
}

function describeField(field: TableStucture): FieldSummary {
	return {
		slug: field.slug,
		label: field.label,
		field_type: field.field_type,
		required: field.params?.required === true,
		system: field.params?.system === true || field.params?.is_auto_generated === true,
		linked_table_id: field.params?.linked_application ?? null,
		choices: Array.isArray(field.params?.choices)
			? field.params.choices.map((choice) => ({ label: choice.label, value: choice.value }))
			: [],
	};
}

export const tableSummary = { summarize, describeField };

export type TableSummary = {
	id: string;
	name: string;
	slug: string | null;
	solution: string | null;
	status: string | null;
	primary_field: string | null;
	fields_count: number | null;
};

export type FieldSummary = {
	slug: string;
	label: string;
	field_type: string;
	required: boolean;
	system: boolean;
	linked_table_id: string | null;
	choices: { label: string; value: string }[];
};
