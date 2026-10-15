import { JSONTransformer } from '@atlaskit/editor-json-transformer';
import { MarkdownTransformer } from '@atlaskit/editor-markdown-transformer';
import { JiraAuth } from '../../auth';

function browseUrl({ auth, issueKey }: { auth: JiraAuth; issueKey: string }): string {
	return `${auth.props.instanceUrl}/browse/${issueKey}`;
}

function markdownToAdf({ markdown }: { markdown: string }): unknown {
	const jsonTransformer = new JSONTransformer();
	const markdownTransformer = new MarkdownTransformer();
	return jsonTransformer.encode(markdownTransformer.parse(markdown));
}

function toPage<T>({ items, startAt, maxResults, total, isLast }: PageInput<T>) {
	const resolvedStartAt = startAt ?? 0;
	return {
		items,
		count: items.length,
		start_at: resolvedStartAt,
		max_results: maxResults ?? null,
		total: total ?? null,
		is_last: isLast ?? (total === undefined ? null : resolvedStartAt + items.length >= total),
	};
}

function toList<T>({ items }: { items: T[] }) {
	return { items, count: items.length };
}

function projectReference({ projectIdOrKey }: { projectIdOrKey: string }) {
	const trimmed = projectIdOrKey.trim();
	return /^\d+$/.test(trimmed) ? { id: trimmed } : { key: trimmed };
}

function buildIssueFields({
	projectIdOrKey,
	issueTypeId,
	summary,
	description,
	assigneeAccountId,
	priorityId,
	labels,
	parentKey,
	dueDate,
	extraFields,
}: IssueFieldsInput): Record<string, unknown> {
	return {
		...(extraFields ?? {}),
		...(isProvided(projectIdOrKey) ? { project: projectReference({ projectIdOrKey }) } : {}),
		...(isProvided(issueTypeId) ? { issuetype: { id: issueTypeId.trim() } } : {}),
		...(isProvided(summary) ? { summary } : {}),
		...(isProvided(description) ? { description: markdownToAdf({ markdown: description }) } : {}),
		...(isProvided(assigneeAccountId) ? { assignee: { accountId: assigneeAccountId.trim() } } : {}),
		...(isProvided(priorityId) ? { priority: { id: priorityId.trim() } } : {}),
		...(labels !== undefined && labels.length > 0 ? { labels } : {}),
		...(isProvided(parentKey) ? { parent: { key: parentKey.trim() } } : {}),
		...(isProvided(dueDate) ? { duedate: dueDate.trim() } : {}),
	};
}

function toStringList({ value }: { value: unknown }): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value
		.map((item) => (typeof item === 'string' || typeof item === 'number' ? String(item).trim() : ''))
		.filter((item) => item.length > 0);
}

function toRecord({ value, label }: { value: unknown; label: string }): Record<string, unknown> | undefined {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}
	if (!isRecord(value)) {
		throw new Error(`${label} must be a JSON object.`);
	}
	return value;
}

function toRecordList({ value, label }: { value: unknown; label: string }): Record<string, unknown>[] {
	if (!Array.isArray(value) || !value.every(isRecord)) {
		throw new Error(`${label} must be a JSON array of objects.`);
	}
	return value;
}

function isProvided(value: string | undefined | null): value is string {
	return value !== undefined && value !== null && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const jiraAiHelpers = {
	browseUrl,
	markdownToAdf,
	toPage,
	toList,
	projectReference,
	buildIssueFields,
	toStringList,
	toRecord,
	toRecordList,
	isProvided,
};

type PageInput<T> = {
	items: T[];
	startAt?: number;
	maxResults?: number;
	total?: number;
	isLast?: boolean;
};

type IssueFieldsInput = {
	projectIdOrKey?: string;
	issueTypeId?: string;
	summary?: string;
	description?: string;
	assigneeAccountId?: string;
	priorityId?: string;
	labels?: string[];
	parentKey?: string;
	dueDate?: string;
	extraFields?: Record<string, unknown>;
};

export type JiraPageBean<T> = {
	values?: T[];
	startAt?: number;
	maxResults?: number;
	total?: number;
	isLast?: boolean;
};

export type JiraRecord = Record<string, unknown>;
