import { Property } from '@activepieces/pieces-framework';

function recordId({ displayName, description }: { displayName: string; description: string }) {
	return Property.ShortText({ displayName, description, required: true });
}

function additionalFields({ description }: { description: string }) {
	return Property.Json({ displayName: 'Additional Fields', description, required: false });
}

function records({ description }: { description: string }) {
	return Property.Array({ displayName: 'Records', description, required: true });
}

function yesNo({ displayName, description }: { displayName: string; description?: string }) {
	return Property.StaticDropdown({
		displayName,
		description,
		required: false,
		options: {
			options: [
				{ label: 'Yes', value: true },
				{ label: 'No', value: false },
			],
		},
	});
}

const pageOptions = {
	search: Property.ShortText({
		displayName: 'Search',
		description: 'Search string or Mautic search command, e.g. "jane" or "email:jane@example.com".',
		required: false,
	}),
	start: Property.Number({
		displayName: 'Start',
		description:
			'Zero-based offset of the first record. Add the limit to it to fetch the next page.',
		required: false,
	}),
	limit: Property.Number({
		displayName: 'Limit',
		description: 'Maximum number of records to return.',
		required: false,
		defaultValue: 30,
	}),
	orderBy: Property.ShortText({
		displayName: 'Order By',
		description: 'Column to sort by, in snake_case, e.g. "date_added" or "id".',
		required: false,
	}),
	orderByDir: Property.StaticDropdown({
		displayName: 'Order Direction',
		required: false,
		options: {
			options: [
				{ label: 'Ascending', value: 'ASC' },
				{ label: 'Descending', value: 'DESC' },
			],
		},
	}),
};

const filterOptions = {
	...pageOptions,
	where: Property.Array({
		displayName: 'Where',
		description:
			'Conditions that must all match. "col" is a column name such as "email" or "id", "expr" a Doctrine expression, "val" the value (comma-separated for in/notIn).',
		required: false,
		properties: {
			col: Property.ShortText({ displayName: 'Column', required: true }),
			expr: Property.StaticDropdown({
				displayName: 'Expression',
				required: true,
				options: {
					options: [
						'eq',
						'neq',
						'lt',
						'lte',
						'gt',
						'gte',
						'like',
						'notLike',
						'in',
						'notIn',
						'isNull',
						'isNotNull',
					].map((expr) => ({ label: expr, value: expr })),
				},
			}),
			val: Property.ShortText({ displayName: 'Value', required: false }),
		},
	}),
};

const listOptions = {
	...filterOptions,
	publishedOnly: Property.Checkbox({
		displayName: 'Published Only',
		description: 'Return only published records.',
		required: false,
	}),
};

const activityOptions = {
	search: Property.ShortText({
		displayName: 'Search',
		description: 'Text to filter events by.',
		required: false,
	}),
	includeEvents: Property.Array({
		displayName: 'Include Event Types',
		description:
			'Event type ids to include, e.g. "page.hit", "email.read", "form.submitted". Taken from the "types" field of a previous response.',
		required: false,
	}),
	excludeEvents: Property.Array({
		displayName: 'Exclude Event Types',
		description: 'Event type ids to exclude.',
		required: false,
	}),
	dateFrom: Property.ShortText({
		displayName: 'Date From',
		description: 'Earliest event time, format "YYYY-MM-DD HH:MM:SS".',
		required: false,
	}),
	dateTo: Property.ShortText({
		displayName: 'Date To',
		description: 'Latest event time, format "YYYY-MM-DD HH:MM:SS".',
		required: false,
	}),
	orderBy: Property.ShortText({
		displayName: 'Order By',
		description: 'Column to sort by, e.g. "timestamp".',
		required: false,
	}),
	orderByDir: pageOptions.orderByDir,
	page: Property.Number({
		displayName: 'Page',
		description: 'Page number, starting at 1.',
		required: false,
	}),
	limit: Property.Number({
		displayName: 'Limit',
		description: 'Events per page.',
		required: false,
		defaultValue: 25,
	}),
};

export const mauticAiProps = {
	recordId,
	yesNo,
	additionalFields,
	records,
	pageOptions,
	filterOptions,
	listOptions,
	activityOptions,
};
