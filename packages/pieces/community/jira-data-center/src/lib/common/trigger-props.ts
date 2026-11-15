import { MarkdownVariant, Property } from '@activepieces/pieces-framework';

export const jiraTriggerProps = { filterHelp, issueFilter };

function filterHelp() {
	return Property.MarkDown({
		value: 'Build a filter in Jira under Issues → Search for issues → Advanced, then copy its JQL here.',
		variant: MarkdownVariant.INFO,
	});
}

function issueFilter() {
	return Property.LongText({
		displayName: 'Issue Filter',
		description: 'JQL query. Empty: every issue is watched.',
		placeholder: 'project = SUPPORT AND status != Done',
		required: false,
	});
}
