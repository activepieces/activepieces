import { HttpMethod } from '@activepieces/pieces-common';
import { InputPropertyMap, Property, isNil } from '@activepieces/pieces-framework';
import { JsmAuthProps, jsmClient } from './client';
import { jsmUsers } from './users';

export const jsmRequestFields = {
	list,
	buildProps,
	formatValues,
	toProperty,
	formatValue,
};

async function list({ auth, serviceDeskId, requestTypeId }: FieldScope): Promise<RequestTypeField[]> {
	const response = await jsmClient.request<{ requestTypeFields?: RequestTypeField[] }>({
		auth,
		api: 'servicedesk',
		method: HttpMethod.GET,
		path: `/servicedesk/${encodeURIComponent(serviceDeskId)}/requesttype/${encodeURIComponent(requestTypeId)}/field`,
	});
	return (response.requestTypeFields ?? []).filter((field) => field.visible !== false);
}

async function buildProps({ auth, serviceDeskId, requestTypeId }: FieldScope): Promise<InputPropertyMap> {
	const fields = await list({ auth, serviceDeskId, requestTypeId });
	return fields.reduce<InputPropertyMap>((acc, field) => {
		const property = toProperty({ auth, field });
		return isNil(property) ? acc : { ...acc, [field.fieldId]: property };
	}, {});
}

async function formatValues({ auth, fields, input }: FormatValuesParams): Promise<Record<string, unknown>> {
	const formatted: Record<string, unknown> = {};
	for (const field of fields) {
		const value = await formatValue({ auth, field, value: input[field.fieldId] });
		if (!isNil(value)) {
			formatted[field.fieldId] = value;
		}
	}
	return formatted;
}

function toProperty({ auth, field }: { auth: JsmAuthProps; field: RequestTypeField }): InputPropertyMap[string] | undefined {
	const kind = fieldKind(field);
	const base = {
		displayName: field.name,
		description: field.description && field.description.length > 0 ? field.description : undefined,
		required: field.required === true,
	};
	switch (kind) {
		case 'skip':
			return undefined;
		case 'single_choice':
			return Property.StaticDropdown({ ...base, options: { disabled: false, options: choiceOptions(field) } });
		case 'multi_choice':
			return Property.StaticMultiSelectDropdown({ ...base, options: { disabled: false, options: choiceOptions(field) } });
		case 'long_text':
			return Property.LongText(base);
		case 'text':
			return Property.ShortText(base);
		case 'number':
			return Property.Number(base);
		case 'date':
		case 'datetime':
			return Property.DateTime(base);
		case 'user':
			return Property.ShortText({ ...base, description: base.description ?? personHint(auth) });
		case 'user_list':
			return Property.Array({ ...base, description: base.description ?? personHint(auth) });
		case 'text_list':
			return Property.Array(base);
		case 'raw':
			return Property.Json({
				...base,
				description: base.description ?? 'Enter the value in the format the Jira REST API expects for this field.',
			});
	}
}

async function formatValue({ auth, field, value }: { auth: JsmAuthProps; field: RequestTypeField; value: unknown }): Promise<unknown> {
	if (isBlank(value)) {
		return undefined;
	}
	switch (fieldKind(field)) {
		case 'skip':
			return undefined;
		case 'single_choice':
			return { id: String(value) };
		case 'multi_choice':
			return emptyToUndefined(jsmUsers.toList(value).map((id) => ({ id })));
		case 'long_text':
		case 'text':
			return String(value);
		case 'number':
			return toNumber({ field, value });
		case 'date':
			return String(value).slice(0, 10);
		case 'datetime':
			return toJiraDateTime(String(value));
		case 'user':
			return personReference({ auth, id: await jsmUsers.resolveOne({ auth, value: String(value) }) });
		case 'user_list': {
			const ids = await jsmUsers.resolveMany({ auth, values: jsmUsers.toList(value) });
			return emptyToUndefined(ids.map((id) => personReference({ auth, id })));
		}
		case 'text_list':
			return emptyToUndefined(jsmUsers.toList(value));
		case 'raw':
			return parseRaw(value);
	}
}

function fieldKind(field: RequestTypeField): FieldKind {
	const schema = field.jiraSchema ?? {};
	if (schema.system === 'attachment' || schema.items === 'attachment') {
		return 'skip';
	}
	if ((field.validValues ?? []).length > 0) {
		return schema.type === 'array' ? 'multi_choice' : 'single_choice';
	}
	if (schema.type === 'string') {
		return isLongText(schema) ? 'long_text' : 'text';
	}
	if (schema.type === 'number') {
		return 'number';
	}
	if (schema.type === 'date') {
		return 'date';
	}
	if (schema.type === 'datetime') {
		return 'datetime';
	}
	if (schema.type === 'user') {
		return 'user';
	}
	if (schema.type === 'array' && schema.items === 'user') {
		return 'user_list';
	}
	if (schema.type === 'array' && schema.items === 'string') {
		return 'text_list';
	}
	return field.required === true ? 'raw' : 'skip';
}

function isLongText(schema: JiraSchema): boolean {
	return schema.system === 'description' || schema.system === 'environment' || (schema.custom ?? '').endsWith(':textarea');
}

function choiceOptions(field: RequestTypeField): { label: string; value: string }[] {
	return (field.validValues ?? []).reduce<{ label: string; value: string }[]>((acc, option) => {
		if (isNil(option.value)) {
			return acc;
		}
		return [...acc, { label: option.label ?? option.value, value: option.value }];
	}, []);
}

function personHint(auth: JsmAuthProps): string {
	return jsmClient.isCloud(auth) ? 'Email or account ID of the person.' : 'Username of the person.';
}

function personReference({ auth, id }: { auth: JsmAuthProps; id: string }): Record<string, string> {
	return jsmClient.isCloud(auth) ? { accountId: id } : { name: id };
}

function toNumber({ field, value }: { field: RequestTypeField; value: unknown }): number {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) {
		throw new Error(`"${field.name}" must be a number, but got "${String(value)}".`);
	}
	return parsed;
}

function toJiraDateTime(value: string): string {
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return value;
	}
	return parsed.toISOString().replace('Z', '+0000');
}

function parseRaw(value: unknown): unknown {
	if (typeof value !== 'string') {
		return value;
	}
	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
}

function isBlank(value: unknown): boolean {
	return isNil(value) || value === '' || (Array.isArray(value) && value.length === 0);
}

function emptyToUndefined<T>(items: T[]): T[] | undefined {
	return items.length === 0 ? undefined : items;
}

export type RequestTypeField = {
	fieldId: string;
	name: string;
	description?: string;
	required?: boolean;
	visible?: boolean;
	jiraSchema?: JiraSchema;
	validValues?: { value?: string; label?: string }[];
};

type JiraSchema = {
	type?: string;
	items?: string;
	system?: string;
	custom?: string;
};

type FieldKind =
	| 'skip'
	| 'single_choice'
	| 'multi_choice'
	| 'long_text'
	| 'text'
	| 'number'
	| 'date'
	| 'datetime'
	| 'user'
	| 'user_list'
	| 'text_list'
	| 'raw';

type FieldScope = {
	auth: JsmAuthProps;
	serviceDeskId: string;
	requestTypeId: string;
};

type FormatValuesParams = {
	auth: JsmAuthProps;
	fields: RequestTypeField[];
	input: Record<string, unknown>;
};
