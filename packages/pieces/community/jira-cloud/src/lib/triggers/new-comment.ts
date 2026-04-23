import {
	Property,
	TriggerStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';
import {
	DedupeStrategy,
	Polling,
	pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { JiraAuth, jiraCloudAuth } from '../../auth';
import { searchIssuesByJql } from '../common';

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

const polling: Polling<JiraAuth, { jql?: string; sanitizeJql?: boolean }> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, lastFetchEpochMS, propsValue }) => {
		const { jql, sanitizeJql } = propsValue;

		const searchQuery = `${jql ? jql + ' AND ' : ''}updated > '${dayjs(
			lastFetchEpochMS,
		).format('YYYY-MM-DD HH:mm')}'`;

		const searchResponse = await searchIssuesByJql({
			auth,
			jql: searchQuery,
			maxResults: 50,
			sanitizeJql: sanitizeJql ?? false,
			fields: ['summary', 'comment'],
		});

		const issues = searchResponse.issues as IssueWithComments[];
		const results: Array<{ epochMilliSeconds: number; data: unknown }> = [];

		for (const issue of issues) {
			const comments = issue.fields?.comment?.comments ?? [];
			for (const comment of comments) {
				const createdMS = Date.parse(comment.created);
				if (Number.isNaN(createdMS) || createdMS <= lastFetchEpochMS) continue;
				results.push({
					epochMilliSeconds: createdMS,
					data: {
						issue: {
							id: issue.id,
							key: issue.key,
							summary: issue.fields?.summary,
						},
						comment,
					},
				});
			}
		}

		return results;
	},
};

export const newComment = createTrigger({
	name: 'new_comment',
	displayName: 'New Comment',
	description:
		'Fires whenever someone adds a new comment to a Jira issue. Great for getting notified in Slack or Teams, syncing customer replies, or reacting to feedback automatically.',
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
		await pollingHelper.onEnable(polling, context);
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, context);
	},
	async run(context) {
		return await pollingHelper.poll(polling, context);
	},
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
});
