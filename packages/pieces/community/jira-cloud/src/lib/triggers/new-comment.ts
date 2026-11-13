import {
	MarkdownVariant,
	Property,
	TriggerStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { JiraPollingItem, createJiraPolling } from '../common/polling';

import { newCommentTriggerOutputSchema } from '../output-schemas';
type JiraComment = {
	id: string;
	self: string;
	body: unknown;
	created: string;
	updated?: string;
	author?: { accountId: string; displayName: string };
	updateAuthor?: { accountId: string; displayName: string };
};

type IssueWithComments = {
	id: string;
	key: string;
	fields?: {
		summary?: string;
		comment?: {
			comments: JiraComment[];
			startAt: number;
			maxResults: number;
			total: number;
		};
	};
};

const polling = createJiraPolling({
	fields: ['summary', 'comment'],
	extractItems: ({ issue }: { issue: IssueWithComments }): JiraPollingItem[] =>
		(issue.fields?.comment?.comments ?? []).map((comment) => ({
			id: comment.id,
			epochMilliSeconds: Date.parse(comment.created),
			data: {
				issue: {
					id: issue.id,
					key: issue.key,
					summary: issue.fields?.summary,
				},
				comment,
			},
		})),
});

export const newComment = createTrigger({
	name: 'new_comment',
	classification: 'READ',
	displayName: 'New Comment',
	description: 'Triggers when a comment is added to an issue.',
	aiMetadata: {
		description:
			'Fires when a new comment is posted on a Jira issue, optionally limited to issues matching a JQL filter. Each event represents one comment and includes the comment body, author, timestamps, and the parent issue. Polling-based; events arrive on the next poll, not instantly.',
	},
	auth: jiraCloudAuth,
	type: TriggerStrategy.POLLING,
	outputSchema: newCommentTriggerOutputSchema,
	props: {
		filterHelp: Property.MarkDown({
			value: 'Build a filter in Jira under Filters → Advanced search, then copy its JQL here.',
			variant: MarkdownVariant.INFO,
		}),
		jql: Property.LongText({
			displayName: 'Issue Filter',
			description: 'JQL query. Empty: every issue is watched.',
			placeholder: 'project = SUPPORT AND status != Done',
			required: false,
		}),
		sanitizeJql: Property.Checkbox({
			displayName: 'Sanitize JQL',
			description: "Jira swaps names you can't view for IDs before the search runs.",
			required: false,
			defaultValue: true,
		}),
	},
	propertyGroups: [
		{
			key: 'filter',
			display: 'section',
			label: 'Filter',
			icon: 'filter',
			props: ['filterHelp', 'jql', 'sanitizeJql'],
		},
	],
	sampleData: {
		issue: {
			id: '10042',
			key: 'EXAMPLE-42',
			summary: 'Checkout page shows an error on submit',
		},
		comment: {
			self: 'https://example.atlassian.net/rest/api/3/issue/10042/comment/10100',
			id: '10100',
			author: {
				self: 'https://example.atlassian.net/rest/api/3/user?accountId=111111%3A11111111-1111-1111-1111-111111111111',
				accountId: '111111:11111111-1111-1111-1111-111111111111',
				emailAddress: 'alice@example.com',
				avatarUrls: {
					'48x48': 'https://example.com/avatar/alice.png',
					'24x24': 'https://example.com/avatar/alice.png',
					'16x16': 'https://example.com/avatar/alice.png',
					'32x32': 'https://example.com/avatar/alice.png',
				},
				displayName: 'Alice Example',
				active: true,
				timeZone: 'UTC',
				accountType: 'atlassian',
			},
			body: {
				type: 'doc',
				version: 1,
				content: [
					{
						type: 'paragraph',
						content: [
							{
								type: 'text',
								text: 'I can reproduce this on the staging site too.',
							},
						],
					},
				],
			},
			updateAuthor: {
				self: 'https://example.atlassian.net/rest/api/3/user?accountId=111111%3A11111111-1111-1111-1111-111111111111',
				accountId: '111111:11111111-1111-1111-1111-111111111111',
				emailAddress: 'alice@example.com',
				avatarUrls: {
					'48x48': 'https://example.com/avatar/alice.png',
					'24x24': 'https://example.com/avatar/alice.png',
					'16x16': 'https://example.com/avatar/alice.png',
					'32x32': 'https://example.com/avatar/alice.png',
				},
				displayName: 'Alice Example',
				active: true,
				timeZone: 'UTC',
				accountType: 'atlassian',
			},
			created: '2024-01-15T10:30:00.000+0000',
			updated: '2024-01-15T10:30:00.000+0000',
			jsdPublic: true,
		},
	},
	async onEnable(context) {
		await polling.onEnable({ context });
	},
	async onDisable() {
		return;
	},
	async run(context) {
		return await polling.poll({ context });
	},
	async test(context) {
		return await polling.test({ context });
	},
});
