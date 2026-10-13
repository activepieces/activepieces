import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeNormalize } from '../common/normalize';
import { Task, TaskPageResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const findTasksAction = createAction({
	auth: taskadeAuth,
	name: 'find_tasks',
	displayName: 'Find Tasks',
	description: 'Finds tasks in a project whose text contains some words.',
	classification: 'SEARCH',
	audience: 'both',
	aiMetadata: {
		description:
			'Finds tasks in one Taskade project whose text contains the given words (case-insensitive), optionally only open or only completed ones, scanning up to 5,000 tasks per call (truncated=true and nextCursor when more remain). Use when the user names a task instead of giving its ID. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		projectId: taskadeAiProps.projectId(),
		textContains: Property.ShortText({
			displayName: 'Text Contains',
			description: 'Words to look for in the task text (case-insensitive).',
			required: true,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: false,
			defaultValue: 'any',
			options: {
				disabled: false,
				options: [
					{ label: 'Any', value: 'any' },
					{ label: 'Open only', value: 'open' },
					{ label: 'Completed only', value: 'completed' },
				],
			},
		}),
		maxResults: Property.Number({
			displayName: 'Max Results',
			description: 'Stop after this many matches (1-500, default 50).',
			required: false,
			defaultValue: 50,
		}),
		startCursor: Property.ShortText({
			displayName: 'Start Cursor',
			description: 'To continue a truncated search, pass nextCursor from the previous result.',
			required: false,
		}),
	},
	outputSchema: taskadeOutputSchemas['findTasks'],
	async run(context) {
		const { projectId, textContains, status, startCursor } = context.propsValue;
		const needle = taskadeApi.requireText({ value: textContains, label: 'Text Contains' }).toLowerCase();
		const maxResults = taskadeApi.validateInteger({ value: context.propsValue.maxResults, label: 'Max Results', min: 1, max: 500 }) ?? 50;
		const path = `${taskadeApi.projectPath(projectId)}/tasks`;
		const matches: Task[] = [];
		let scanned = 0;
		let after: string | undefined = (startCursor ?? '').trim() || undefined;
		for (let page = 0; page < MAX_PAGES; page++) {
			const response = await taskadeApi.request<TaskPageResponse>({
				token: context.auth.secret_text,
				method: HttpMethod.GET,
				path,
				operation: 'list tasks',
				query: { limit: PAGE_SIZE, after },
			});
			const items = (response.items ?? []).map((item) => taskadeNormalize.task(item));
			scanned += items.length;
			const pageMatches = items.filter((task) => !task.isRoot && matchesStatus({ task, status }) && task.text.toLowerCase().includes(needle));
			matches.push(...pageMatches);
			const hasMore = response.hasMore ?? items.length === PAGE_SIZE;
			const nextCursor = response.nextCursor ?? items[items.length - 1]?.id;
			if (matches.length >= maxResults) {
				const cut = matches.slice(0, maxResults);
				const lastMatch = cut[cut.length - 1];
				const remainderOnPage = items.findIndex((task) => task.id === lastMatch.id) < items.length - 1;
				const truncated = remainderOnPage || hasMore;
				return { found: true, items: cut, scanned, truncated, nextCursor: truncated ? lastMatch.id : null };
			}
			if (!hasMore || items.length === 0 || !nextCursor) {
				return { found: matches.length > 0, items: matches, scanned, truncated: false, nextCursor: null };
			}
			after = nextCursor;
		}
		return { found: matches.length > 0, items: matches, scanned, truncated: true, nextCursor: after ?? null };
	},
});

function matchesStatus({ task, status }: { task: Task; status: unknown }): boolean {
	if (status === 'open') {
		return !task.completed;
	}
	if (status === 'completed') {
		return task.completed;
	}
	return true;
}

const PAGE_SIZE = 1000;
const MAX_PAGES = 5;
