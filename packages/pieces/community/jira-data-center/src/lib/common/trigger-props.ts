import { MarkdownVariant, Property } from '@activepieces/pieces-framework';

const props = {
	filterHelp: Property.MarkDown({
		value: 'Build a filter in Jira under Issues → Search for issues → Advanced, then copy its JQL here.',
		variant: MarkdownVariant.INFO,
	}),
	jql: Property.LongText({
		displayName: 'Issue Filter',
		description: 'JQL query. Empty: every issue is watched.',
		placeholder: 'project = SUPPORT AND status != Done',
		required: false,
	}),
};

const propertyGroups = [
	{
		key: 'filter',
		display: 'section' as const,
		label: 'Filter',
		icon: 'filter',
		props: ['filterHelp', 'jql'],
	},
];

export const jiraTriggerFilter = { props, propertyGroups };
