import {
	Property,
	TriggerStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { JiraPollingItem, createJiraPolling } from '../common/polling';

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
	displayName: 'New Comment',
	description:
		'Fires whenever someone adds a new comment to a Jira issue. Great for getting notified in Slack or Teams, syncing customer replies, or reacting to feedback automatically.',
	aiMetadata: {
		description:
			'Fires when a new comment is posted on a Jira issue, optionally limited to issues matching a JQL filter. Each event represents one comment and includes the comment body, author, timestamps, and the parent issue. Polling-based; events arrive on the next poll, not instantly.',
	},
	auth: jiraCloudAuth,
	type: TriggerStrategy.POLLING,
	props: {
		jql: Property.LongText({
			displayName: 'Only watch these issues (optional)',
			description: `Leave empty to watch comments on **every** issue in your Jira.

To narrow it down, paste a Jira filter here. A few ready-to-use examples:

- \`project = "SUPPORT"\` — only issues in the Support project
- \`assignee = currentUser()\` — only issues assigned to you
- \`status != Done\` — skip closed issues
- \`labels = "vip"\` — only issues tagged \`vip\`
- \`project = "SUPPORT" AND priority = High\` — combine conditions with \`AND\`

Not sure what to write? Open Jira → Filters → Advanced search, build the filter visually, then copy the query here.`,
			required: false,
		}),
		sanitizeJql: Property.Checkbox({
			displayName: 'Auto-fix the filter',
			description:
				'Keep this on. If your filter references something you can\'t access (a private project, a deleted field), Jira will automatically clean it up instead of erroring.',
			required: false,
			defaultValue: true,
		}),
	},
	sampleData: {},
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
