import { Property } from '@activepieces/pieces-framework';

function issueIdOrKey({ displayName, description }: PropText = {}) {
	return Property.ShortText({
		displayName: displayName ?? 'Issue ID or Key',
		description: description ?? 'The issue key (e.g. PROJ-123) or numeric issue ID. Find it with Search Issues by JQL.',
		required: true,
	});
}

function projectIdOrKey({ description }: PropText = {}) {
	return Property.ShortText({
		displayName: 'Project ID or Key',
		description: description ?? 'The project key (e.g. PROJ) or numeric project ID. Find it with List Projects.',
		required: true,
	});
}

function accountId({ displayName, description }: PropText = {}) {
	return Property.ShortText({
		displayName: displayName ?? 'Account ID',
		description: description ?? 'The Atlassian account ID of the user. Resolve it with Find Users or Get Current User.',
		required: true,
	});
}

function startAt() {
	return Property.Number({
		displayName: 'Start At',
		description: 'Zero-based index of the first item to return, for pagination.',
		required: false,
		defaultValue: 0,
	});
}

function maxResults({ defaultValue = 50, max }: { defaultValue?: number; max?: number } = {}) {
	return Property.Number({
		displayName: 'Max Results',
		description: max === undefined ? 'Maximum number of items to return in this page.' : `Maximum number of items to return in this page (up to ${max}).`,
		required: false,
		defaultValue,
	});
}

function markdownText({ displayName, description }: { displayName: string; description: string }) {
	return Property.LongText({
		displayName,
		description: `${description} ${MARKDOWN_NOTE}`,
		required: true,
	});
}

function optionalMarkdownText({ displayName, description }: { displayName: string; description: string }) {
	return Property.LongText({
		displayName,
		description: `${description} ${MARKDOWN_NOTE}`,
		required: false,
	});
}

export const jiraAiProps = {
	issueIdOrKey,
	projectIdOrKey,
	accountId,
	startAt,
	maxResults,
	markdownText,
	optionalMarkdownText,
};

const MARKDOWN_NOTE = 'Markdown is supported and converted to Atlassian Document Format.';

type PropText = { displayName?: string; description?: string };
