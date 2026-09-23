import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

export const sendIssueNotificationAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'send_issue_notification',
	classification: 'WRITE',
	displayName: 'Send Issue Notification',
	description: 'Sends an email notification about an issue.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Send a custom email notification about an issue to its reporter, assignee, watchers, voters, specific users (by account ID) or groups (by group ID). At least one recipient must be selected. Jira queues the email, so delivery is not confirmed. Not idempotent: every call sends another email.',
		idempotent: false,
	},
	props: {
		issueIdOrKey: jiraAiProps.issueIdOrKey(),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Email subject. Defaults to the issue key and summary.',
			required: false,
		}),
		textBody: Property.LongText({
			displayName: 'Text Body',
			description: 'Plain-text body of the email.',
			required: true,
		}),
		htmlBody: Property.LongText({
			displayName: 'HTML Body',
			description: 'Optional HTML body of the email.',
			required: false,
		}),
		notifyReporter: Property.Checkbox({ displayName: 'Notify Reporter', required: false, defaultValue: false }),
		notifyAssignee: Property.Checkbox({ displayName: 'Notify Assignee', required: false, defaultValue: false }),
		notifyWatchers: Property.Checkbox({ displayName: 'Notify Watchers', required: false, defaultValue: false }),
		notifyVoters: Property.Checkbox({ displayName: 'Notify Voters', required: false, defaultValue: false }),
		userAccountIds: Property.Array({
			displayName: 'User Account IDs',
			description: 'Account IDs of additional users to notify. Resolve them with Find Users.',
			required: false,
		}),
		groupIds: Property.Array({
			displayName: 'Group IDs',
			description: 'IDs of groups to notify. Find them with Get User Groups.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const userAccountIds = jiraAiHelpers.toStringList({ value: propsValue.userAccountIds });
		const groupIds = jiraAiHelpers.toStringList({ value: propsValue.groupIds });
		const to = {
			reporter: propsValue.notifyReporter === true,
			assignee: propsValue.notifyAssignee === true,
			watchers: propsValue.notifyWatchers === true,
			voters: propsValue.notifyVoters === true,
			users: userAccountIds.map((accountId) => ({ accountId })),
			groupIds,
		};
		if (!to.reporter && !to.assignee && !to.watchers && !to.voters && userAccountIds.length === 0 && groupIds.length === 0) {
			throw new Error('Select at least one recipient: reporter, assignee, watchers, voters, users or groups.');
		}
		const issueIdOrKey = propsValue.issueIdOrKey.trim();
		await jiraApiCall({
			auth,
			method: HttpMethod.POST,
			resourceUri: `/issue/${encodeURIComponent(issueIdOrKey)}/notify`,
			body: {
				textBody: propsValue.textBody,
				to,
				...(jiraAiHelpers.isProvided(propsValue.subject) ? { subject: propsValue.subject } : {}),
				...(jiraAiHelpers.isProvided(propsValue.htmlBody) ? { htmlBody: propsValue.htmlBody } : {}),
			},
		});
		return { success: true, issue: issueIdOrKey, queued: true };
	},
});
