import { Property } from '@activepieces/pieces-framework';

function objectNamePlural<R extends boolean>({
	required,
	displayName = 'Object',
	description = 'Plural API name of the object, e.g. "companies", "people", "opportunities", "tasks", "notes", or a custom object\'s plural name. Use List Objects (the `namePlural` field) to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function recordId<R extends boolean>({
	required,
	displayName = 'Record ID',
	description = 'UUID of the record, from List Records, Create Record or Get Record (the `id` field).',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function recordIds<R extends boolean>({
	required,
	displayName = 'Record IDs',
	description = 'Record UUIDs of the same object, from List Records (the `id` field).',
}: PropParams<R>) {
	return Property.Array({ displayName, description, required });
}

function record<R extends boolean>({
	required,
	displayName = 'Record',
	description = 'Field values as a JSON object keyed by field name. Composite fields are objects, e.g. {"name": {"firstName": "Ada", "lastName": "Lovelace"}, "emails": {"primaryEmail": "ada@example.com"}, "domainName": {"primaryLinkUrl": "https://acme.com"}, "amount": {"amountMicros": 5000000000, "currencyCode": "USD"}}. Relations take the related record\'s id, e.g. {"companyId": "<uuid>"}. Use Get Object to see field names and types.',
}: PropParams<R>) {
	return Property.Json({ displayName, description, required });
}

function filter<R extends boolean>({
	required,
	displayName = 'Filter',
	description = 'Twenty filter expression: field[comparator]:value, comma-separated for AND, or and(...), or(...), not(...). Comparators: eq, neq, in, containsAny, is (NULL / NOT_NULL), gt, gte, lt, lte, startsWith, endsWith, like, ilike (% wildcard). Composite fields use dot paths. Examples: emails.primaryEmail[eq]:"ada@example.com", name.firstName[eq]:"Ada", domainName.primaryLinkUrl[ilike]:"%acme%", stage[in]:["MEETING","PROPOSAL"], createdAt[gte]:"2026-01-01". Use deletedAt[is]:NOT_NULL to find soft-deleted records.',
}: PropParams<R>) {
	return Property.LongText({ displayName, description, required });
}

function orderBy<R extends boolean>({
	required,
	displayName = 'Order By',
	description = 'Sort expression: field[direction], comma-separated. Directions: AscNullsFirst, AscNullsLast, DescNullsFirst, DescNullsLast. Example: createdAt[DescNullsLast].',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function limit<R extends boolean>({
	required,
	displayName = 'Limit',
	description = 'Maximum number of items to return (1-200). Defaults to 60.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function startingAfter<R extends boolean>({
	required,
	displayName = 'Starting After',
	description = 'Cursor for the next page: pass `pageInfo.endCursor` from the previous call, with the same filters. Omit for the first page.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function depth<R extends boolean>({
	required,
	displayName = 'Depth',
	description = "Relation depth: 0 returns only the record's own fields (relations as ids), 1 also embeds directly related records. Defaults to 0.",
}: PropParams<R>) {
	return Property.StaticDropdown({
		displayName,
		description,
		required,
		options: {
			disabled: false,
			options: [
				{ label: '0', value: 0 },
				{ label: '1', value: 1 },
			],
		},
	});
}

function fields<R extends boolean>({
	required,
	displayName = 'Fields',
	description = 'Comma-separated field names to return, e.g. "id,name,emails,companyId". `id` is always returned. Omit to return every field.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

export const twentyAiProps = {
	objectNamePlural,
	recordId,
	recordIds,
	record,
	filter,
	orderBy,
	limit,
	startingAfter,
	depth,
	fields,
};

export type PropParams<R extends boolean> = {
	required: R;
	displayName?: string;
	description?: string;
};
