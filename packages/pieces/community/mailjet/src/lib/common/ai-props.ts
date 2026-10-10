import { Property } from '@activepieces/pieces-framework';

function id({ displayName, description }: { displayName: string; description: string }) {
	return Property.ShortText({ displayName, description, required: true });
}

function yesNo({ displayName, description }: { displayName: string; description: string }) {
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

function listAction({ description }: { description: string }) {
	return Property.StaticDropdown({
		displayName: 'Action',
		description,
		required: true,
		options: {
			options: [
				{ label: 'Add and subscribe (addforce)', value: 'addforce' },
				{ label: 'Add, keep unsubscribed state (addnoforce)', value: 'addnoforce' },
				{ label: 'Remove (remove)', value: 'remove' },
				{ label: 'Unsubscribe (unsub)', value: 'unsub' },
			],
		},
	});
}

const paging = {
	limit: Property.Number({
		displayName: 'Limit',
		description: 'Maximum number of records to return (1-1000). Mailjet defaults to 10.',
		required: false,
	}),
	offset: Property.Number({
		displayName: 'Offset',
		description: 'Number of records to skip. Add the limit to it to fetch the next page.',
		required: false,
	}),
	sort: Property.ShortText({
		displayName: 'Sort',
		description:
			'Field to sort by, optionally followed by " DESC", e.g. "ID DESC". Some resources reject DESC or a field with a 400; omit sort then.',
		required: false,
	}),
};

export const mailjetAiProps = { id, yesNo, listAction, paging };
