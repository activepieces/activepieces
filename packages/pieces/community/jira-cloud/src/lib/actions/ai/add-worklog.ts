import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { worklogOutputSchema } from '../../output-schemas';
export const addWorklogAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'add_worklog',
	classification: 'WRITE',
	displayName: 'Add Worklog',
	description: 'Logs time spent on an issue.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Log time spent on an issue as a worklog entry, with an optional start time and comment, adjusting the remaining estimate automatically unless told otherwise. Time tracking must be enabled on the site. Not idempotent: each call adds another entry, so use Get Worklogs to check before retrying.',
		idempotent: false,
	},
	outputSchema: worklogOutputSchema,
	props: {
		issueIdOrKey: jiraAiProps.issueIdOrKey(),
		timeSpent: Property.ShortText({
			displayName: 'Time Spent',
			description: 'Time spent in Jira duration format, e.g. 3h 20m, 1d, 45m.',
			required: true,
		}),
		started: Property.DateTime({
			displayName: 'Started',
			description: 'When the work started (ISO 8601). Defaults to now.',
			required: false,
		}),
		comment: jiraAiProps.optionalMarkdownText({ displayName: 'Comment', description: 'Optional description of the work done.' }),
		adjustEstimate: Property.StaticDropdown({
			displayName: 'Adjust Remaining Estimate',
			description: 'How to update the remaining estimate. Defaults to auto (reduce by the time spent).',
			required: false,
			options: {
				options: [
					{ label: 'Auto (reduce by time spent)', value: 'auto' },
					{ label: 'Leave unchanged', value: 'leave' },
					{ label: 'Set to New Estimate', value: 'new' },
					{ label: 'Reduce by Reduce By', value: 'manual' },
				],
			},
		}),
		newEstimate: Property.ShortText({
			displayName: 'New Estimate',
			description: 'New remaining estimate, e.g. 2d. Required when Adjust Remaining Estimate is Set to New Estimate.',
			required: false,
		}),
		reduceBy: Property.ShortText({
			displayName: 'Reduce By',
			description: 'Amount to reduce the remaining estimate by, e.g. 2h. Required when Adjust Remaining Estimate is Reduce by Reduce By.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const started = jiraAiHelpers.isProvided(propsValue.started) ? dayjs(propsValue.started) : dayjs();
		if (!started.isValid()) {
			throw new Error('Started must be a valid ISO 8601 date-time.');
		}
		return jiraApiCall<JiraRecord>({
			auth,
			method: HttpMethod.POST,
			resourceUri: `/issue/${encodeURIComponent(propsValue.issueIdOrKey.trim())}/worklog`,
			query: {
				adjustEstimate: propsValue.adjustEstimate,
				newEstimate: propsValue.adjustEstimate === 'new' ? propsValue.newEstimate : undefined,
				reduceBy: propsValue.adjustEstimate === 'manual' ? propsValue.reduceBy : undefined,
			},
			body: {
				timeSpent: propsValue.timeSpent.trim(),
				started: started.format(JIRA_DATE_TIME_FORMAT),
				...(jiraAiHelpers.isProvided(propsValue.comment) ? { comment: jiraAiHelpers.markdownToAdf({ markdown: propsValue.comment }) } : {}),
			},
		});
	},
});

const JIRA_DATE_TIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZZ';
