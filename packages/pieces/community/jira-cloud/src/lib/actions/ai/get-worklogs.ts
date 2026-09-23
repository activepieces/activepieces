import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { worklogPageOutputSchema } from '../../output-schemas';
export const getWorklogsAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_worklogs',
	classification: 'SEARCH',
	displayName: 'Get Worklogs',
	description: 'Lists the worklogs of an issue.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the worklog entries of an issue, oldest first, with author, time spent in seconds, start time and comment, optionally limited to work started within a date range. Use it for time reports or to find a worklog ID for Delete Worklog. Read-only.',
		idempotent: true,
	},
	outputSchema: worklogPageOutputSchema,
	props: {
		issueIdOrKey: jiraAiProps.issueIdOrKey(),
		startedAfter: Property.DateTime({
			displayName: 'Started After',
			description: 'Only return worklogs started on or after this time (ISO 8601).',
			required: false,
		}),
		startedBefore: Property.DateTime({
			displayName: 'Started Before',
			description: 'Only return worklogs started on or before this time (ISO 8601).',
			required: false,
		}),
		startAt: jiraAiProps.startAt(),
		maxResults: jiraAiProps.maxResults({ max: 5000 }),
	},
	async run({ auth, propsValue }) {
		const response = await jiraApiCall<WorklogPage>({
			auth,
			method: HttpMethod.GET,
			resourceUri: `/issue/${encodeURIComponent(propsValue.issueIdOrKey.trim())}/worklog`,
			query: {
				startAt: propsValue.startAt,
				maxResults: propsValue.maxResults,
				startedAfter: toEpochMillis({ value: propsValue.startedAfter, label: 'Started After' }),
				startedBefore: toEpochMillis({ value: propsValue.startedBefore, label: 'Started Before' }),
			},
		});
		return jiraAiHelpers.toPage({
			items: response.worklogs ?? [],
			startAt: response.startAt,
			maxResults: response.maxResults,
			total: response.total,
		});
	},
});

function toEpochMillis({ value, label }: { value: string | undefined; label: string }): number | undefined {
	if (!jiraAiHelpers.isProvided(value)) {
		return undefined;
	}
	const parsed = dayjs(value);
	if (!parsed.isValid()) {
		throw new Error(`${label} must be a valid ISO 8601 date-time.`);
	}
	return parsed.valueOf();
}

type WorklogPage = {
	worklogs?: JiraRecord[];
	startAt?: number;
	maxResults?: number;
	total?: number;
};
