import {
	createTrigger,
	Store,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { todoistProjectIdDropdown } from '../common/props';
import { todoistAuth } from '../..';
import { todoistRestClient } from '../common/client/rest-client';
import { TodoistCompletedTask } from '../common/models';
import { taskCompletedTriggerOutputSchema } from '../output-schemas';

export const todoistTaskCompletedTrigger = createTrigger({
	auth: todoistAuth,
	name: 'task_completed',
	classification: 'READ',
	displayName: 'Task Completed',
	description: 'Fires when a task is marked complete.',
	aiMetadata: {
		description: 'Fires when a Todoist task is marked completed, emitting the completed task record. Polls for tasks closed since the last check, optionally limited to a single project (all projects if left blank).',
	},
	type: TriggerStrategy.POLLING,
	outputSchema: taskCompletedTriggerOutputSchema,

	props: {
		project_id: todoistProjectIdDropdown(
			'Leave empty to watch every project.',
		),
	},

	async onEnable(context) {
		const projectId = normalizeProjectId(context.propsValue.project_id);
		if (context.isRepublish) {
			const state = await readState(context.store);
			if (state !== null && isSameProject({ state, projectId })) {
				return;
			}
		}
		await resetCursor({ store: context.store, projectId });
	},

	async onDisable() {
		return;
	},
	async test(context) {
		return await latestCompletions({
			token: context.auth.access_token,
			projectId: normalizeProjectId(context.propsValue.project_id),
		});
	},
	async run(context) {
		return await pollNewCompletions({
			store: context.store,
			token: context.auth.access_token,
			projectId: normalizeProjectId(context.propsValue.project_id),
		});
	},
	sampleData: {
		id: '1899066186',
		user_id: '2671355',
		project_id: '2203306141',
		section_id: '7025',
		parent_id: null,
		added_by_uid: '2671355',
		assigned_by_uid: null,
		responsible_uid: null,
		completed_by_uid: '2671355',
		labels: [],
		checked: true,
		is_deleted: false,
		content: 'Buy Milk',
		description: '',
		priority: 1,
		note_count: 0,
		due: null,
		added_at: '2015-02-17T15:35:00.000000Z',
		completed_at: '2015-02-17T15:40:41.000000Z',
		updated_at: '2015-02-17T15:40:41.000000Z',
	},
});

const STATE_KEY = 'taskCompletedState';
const LEGACY_LAST_POLL_KEY = 'lastPoll';
const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const DAY_MS = 24 * 60 * MINUTE_MS;
const OVERLAP_MS = 15 * MINUTE_MS;
const MAX_RANGE_MS = 89 * DAY_MS;
const MAX_CHUNK_MS = 7 * DAY_MS;
const MIN_CHUNK_MS = MINUTE_MS;
const REQUEST_TIMEOUT_MS = 15 * SECOND_MS;
const POLL_DEADLINE_MS = 40 * SECOND_MS;
const SAMPLE_WINDOWS_MS = [DAY_MS, 7 * DAY_MS, 30 * DAY_MS, MAX_RANGE_MS];
const SAMPLE_SIZE = 5;
const MAX_CURSOR_RESTARTS = 2;
const MAX_STATE_BYTES = 256 * 1024;

function floorToSecond(epochMs: number): number {
	return Math.floor(epochMs / SECOND_MS) * SECOND_MS;
}

function toUtcParam(epochMs: number): string {
	return new Date(floorToSecond(epochMs)).toISOString().replace('.000Z', 'Z');
}

function completedAtMs(completedAt: string | null | undefined): number {
	if (!completedAt) {
		return NaN;
	}
	const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(completedAt);
	return Date.parse(hasZone ? completedAt : `${completedAt}Z`);
}

function completionKey(task: TodoistCompletedTask): string {
	return `${task.id}|${task.completed_at}`;
}

function keyEpochMs(key: string): number {
	return completedAtMs(key.slice(key.indexOf('|') + 1));
}

function normalizeProjectId(projectId: string | undefined): string | null {
	return projectId ? projectId : null;
}

function isSameProject({ state, projectId }: { state: CursorState; projectId: string | null }): boolean {
	return state.projectId === undefined || state.projectId === projectId;
}

function clampChunk(chunkMs: number | undefined): number {
	if (typeof chunkMs !== 'number' || !Number.isFinite(chunkMs)) {
		return MAX_CHUNK_MS;
	}
	return Math.min(Math.max(floorToSecond(chunkMs), MIN_CHUNK_MS), MAX_CHUNK_MS);
}

function isStaleCursorError(error: unknown): boolean {
	if (typeof error !== 'object' || error === null || !('response' in error)) {
		return false;
	}
	const response: unknown = error.response;
	if (typeof response !== 'object' || response === null || !('status' in response)) {
		return false;
	}
	return response.status === 400 || response.status === 404 || response.status === 410;
}

function storedFloor({ floor, cursor }: { floor: unknown; cursor: number }): number {
	return typeof floor === 'number' && Number.isFinite(floor) ? floor : cursor;
}

function storedResume(resume: Partial<ResumePoint> | null | undefined): ResumePoint | null {
	if (
		resume === null ||
		resume === undefined ||
		typeof resume.since !== 'number' ||
		typeof resume.until !== 'number' ||
		resume.until - resume.since > MIN_CHUNK_MS
	) {
		return null;
	}
	return {
		since: resume.since,
		until: resume.until,
		cursor: typeof resume.cursor === 'string' ? resume.cursor : null,
		restarts: typeof resume.restarts === 'number' ? resume.restarts : 0,
	};
}

async function readState(store: Store): Promise<CursorState | null> {
	const state = await store.get<Partial<CursorState>>(STATE_KEY);
	if (state !== null && typeof state === 'object' && typeof state.cursor === 'number' && Number.isFinite(state.cursor)) {
		return {
			cursor: state.cursor,
			seen: Array.isArray(state.seen) ? state.seen : [],
			floor: storedFloor({ floor: state.floor, cursor: state.cursor }),
			projectId: state.projectId,
			chunkMs: clampChunk(state.chunkMs),
			resume: storedResume(state.resume),
		};
	}
	const legacyCursor = await store.get<number>(LEGACY_LAST_POLL_KEY);
	if (typeof legacyCursor !== 'number' || !Number.isFinite(legacyCursor)) {
		return null;
	}
	return {
		cursor: legacyCursor,
		seen: [],
		floor: legacyCursor,
		projectId: undefined,
		chunkMs: MAX_CHUNK_MS,
		resume: null,
	};
}

async function fetchPages({
	token,
	projectId,
	sinceMs,
	untilMs,
	startCursor,
	deadline,
}: {
	token: string;
	projectId: string | null;
	sinceMs: number;
	untilMs: number;
	startCursor: string | null;
	deadline: number;
}): Promise<PagedFetch> {
	const pages: TodoistCompletedTask[][] = [];
	let cursor = startCursor;
	let started = false;
	while (!started || cursor !== null) {
		if (Date.now() + REQUEST_TIMEOUT_MS > deadline) {
			return { completions: toCompletions(pages.flat()), complete: false, nextCursor: cursor, requests: pages.length };
		}
		started = true;
		const page = await todoistRestClient.tasks.listCompletedByCompletionDatePage({
			token,
			since: toUtcParam(sinceMs),
			until: toUtcParam(untilMs),
			project_id: projectId ?? undefined,
			cursor,
			timeoutMs: REQUEST_TIMEOUT_MS,
		});
		pages.push(page.items);
		cursor = page.next_cursor ? page.next_cursor : null;
	}
	return { completions: toCompletions(pages.flat()), complete: true, nextCursor: null, requests: pages.length };
}

function toCompletions(tasks: TodoistCompletedTask[]): Completion[] {
	return tasks
		.map((task) => ({ task, epochMs: completedAtMs(task.completed_at) }))
		.filter(({ epochMs }) => Number.isFinite(epochMs));
}

async function fetchInChunks({
	token,
	projectId,
	sinceMs,
	untilMs,
	state,
	deadline,
}: {
	token: string;
	projectId: string | null;
	sinceMs: number;
	untilMs: number;
	state: CursorState;
	deadline: number;
}): Promise<ChunkedFetch> {
	const collected: Completion[][] = [];
	let chunkMs = clampChunk(state.chunkMs);
	let completeThrough = sinceMs;
	let resume = state.resume !== null && state.resume.since === sinceMs && state.resume.until <= untilMs ? state.resume : null;
	while (completeThrough < untilMs) {
		const chunkStart = completeThrough;
		const chunkEnd = resume !== null ? resume.until : Math.min(chunkStart + chunkMs, untilMs);
		const attempt = await fetchChunkAttempt({ token, projectId, chunkStart, chunkEnd, resume, deadline });
		const inChunk = attempt.completions.filter(({ epochMs }) => epochMs >= chunkStart && epochMs < chunkEnd);
		if (attempt.complete) {
			collected.push(inChunk);
			completeThrough = chunkEnd;
			resume = null;
			chunkMs = clampChunk(chunkMs * 2);
			continue;
		}
		if (attempt.requests === 0) {
			break;
		}
		if (chunkMs > MIN_CHUNK_MS) {
			chunkMs = clampChunk(Math.min(chunkMs, chunkEnd - chunkStart) / 2);
			resume = null;
			break;
		}
		collected.push(inChunk);
		if (attempt.restarts >= MAX_CURSOR_RESTARTS) {
			console.warn(
				`Todoist Task Completed: page cursors keep expiring inside ${toUtcParam(chunkStart)}–${toUtcParam(chunkEnd)}; the rest of that minute is skipped.`,
			);
			completeThrough = chunkEnd;
			resume = null;
			break;
		}
		resume = { since: chunkStart, until: chunkEnd, cursor: attempt.nextCursor, restarts: attempt.restarts };
		break;
	}
	return { completions: collected.flat(), completeThrough, chunkMs, resume };
}

async function fetchChunkAttempt({
	token,
	projectId,
	chunkStart,
	chunkEnd,
	resume,
	deadline,
}: {
	token: string;
	projectId: string | null;
	chunkStart: number;
	chunkEnd: number;
	resume: ResumePoint | null;
	deadline: number;
}): Promise<PagedFetch & { restarts: number }> {
	const restarts = resume?.restarts ?? 0;
	if (resume === null || resume.cursor === null) {
		const page = await fetchPages({ token, projectId, sinceMs: chunkStart, untilMs: chunkEnd, startCursor: null, deadline });
		return { ...page, restarts };
	}
	try {
		const page = await fetchPages({ token, projectId, sinceMs: chunkStart, untilMs: chunkEnd, startCursor: resume.cursor, deadline });
		return { ...page, restarts };
	} catch (error) {
		if (!isStaleCursorError(error)) {
			throw error;
		}
		const page = await fetchPages({ token, projectId, sinceMs: chunkStart, untilMs: chunkEnd, startCursor: null, deadline });
		return { ...page, restarts: restarts + 1 };
	}
}

async function resetCursor({
	store,
	projectId,
}: {
	store: Store;
	projectId: string | null;
}): Promise<void> {
	const now = Date.now();
	const state: CursorState = {
		cursor: now,
		seen: [],
		floor: now,
		projectId,
		chunkMs: MAX_CHUNK_MS,
		resume: null,
	};
	await store.put(STATE_KEY, state);
}

async function pollNewCompletions({
	store,
	token,
	projectId,
}: {
	store: Store;
	token: string;
	projectId: string | null;
}): Promise<TodoistCompletedTask[]> {
	const now = Date.now();
	const state = await readState(store);
	if (state === null || !isSameProject({ state, projectId })) {
		await resetCursor({ store, projectId });
		return [];
	}

	const oldestAllowed = floorToSecond(now - MAX_RANGE_MS);
	const sinceMs = Math.max(floorToSecond(state.cursor - OVERLAP_MS), oldestAllowed);
	if (floorToSecond(state.cursor - OVERLAP_MS) < oldestAllowed) {
		console.warn(
			`Todoist Task Completed: last check was more than 89 days ago; completions before ${toUtcParam(oldestAllowed)} are skipped.`,
		);
	}
	const untilMs = floorToSecond(now) + SECOND_MS;

	const fetched = await fetchInChunks({
		token,
		projectId,
		sinceMs,
		untilMs,
		state,
		deadline: now + POLL_DEADLINE_MS,
	});
	const seen = new Set(state.seen);
	const fresh = fetched.completions
		.filter(({ task, epochMs }) => epochMs > state.floor && !seen.has(completionKey(task)))
		.sort((a, b) => a.epochMs - b.epochMs);
	if (fetched.completeThrough < untilMs) {
		console.warn(
			`Todoist Task Completed: caught up to ${toUtcParam(fetched.completeThrough)} before the poll deadline; the rest comes on the next poll.`,
		);
	}

	await store.put(STATE_KEY, nextState({ state, fetched, untilMs, now, projectId }));

	return fresh.map(({ task }) => task);
}

function nextState({
	state,
	fetched,
	untilMs,
	now,
	projectId,
}: {
	state: CursorState;
	fetched: ChunkedFetch;
	untilMs: number;
	now: number;
	projectId: string | null;
}): CursorState {
	const finished = fetched.completeThrough >= untilMs;
	const newestEpoch = fetched.completions.reduce((acc, { epochMs }) => Math.max(acc, epochMs), state.cursor);
	const cursor = finished ? Math.max(newestEpoch, now - OVERLAP_MS) : fetched.completeThrough + OVERLAP_MS;
	const threshold = floorToSecond(cursor - OVERLAP_MS);
	const keys = new Set([...state.seen, ...fetched.completions.map(({ task }) => completionKey(task))]);
	return capStateSize({
		cursor,
		seen: [...keys].filter((key) => keyEpochMs(key) >= threshold),
		floor: state.floor,
		projectId,
		chunkMs: fetched.chunkMs,
		resume: fetched.resume,
	});
}

function capStateSize(state: CursorState): CursorState {
	if (Buffer.byteLength(JSON.stringify(state)) <= MAX_STATE_BYTES) {
		return state;
	}
	const newestFirst = [...state.seen].sort((a, b) => keyEpochMs(b) - keyEpochMs(a));
	const budget = MAX_STATE_BYTES - Buffer.byteLength(JSON.stringify({ ...state, seen: [] }));
	const kept: string[] = [];
	let used = 0;
	for (const key of newestFirst) {
		const size = Buffer.byteLength(JSON.stringify(key)) + 1;
		if (used + size > budget) {
			break;
		}
		kept.push(key);
		used += size;
	}
	const dropped = newestFirst.slice(kept.length);
	const newestDropped = dropped.reduce((acc, key) => Math.max(acc, keyEpochMs(key)), state.floor);
	const seen = kept.filter((key) => keyEpochMs(key) > newestDropped);
	console.warn(
		`Todoist Task Completed: ${dropped.length} remembered completions exceed the store limit; completions at or before ${toUtcParam(newestDropped)} that have not fired yet are skipped.`,
	);
	return { ...state, seen, floor: newestDropped };
}

async function latestCompletions({
	token,
	projectId,
}: {
	token: string;
	projectId: string | null;
}): Promise<TodoistCompletedTask[]> {
	const now = Date.now();
	const deadline = now + POLL_DEADLINE_MS;
	const untilMs = floorToSecond(now) + SECOND_MS;
	for (const windowMs of SAMPLE_WINDOWS_MS) {
		const { completions, complete } = await fetchPages({
			token,
			projectId,
			sinceMs: floorToSecond(now - windowMs),
			untilMs,
			startCursor: null,
			deadline,
		});
		if (completions.length === 0 && !complete) {
			throw new Error(
				'Todoist did not answer in time while looking for recently completed tasks. Click Test again in a moment.',
			);
		}
		if (completions.length > 0) {
			return completions
				.sort((a, b) => b.epochMs - a.epochMs)
				.slice(0, SAMPLE_SIZE)
				.reverse()
				.map(({ task }) => task);
		}
	}
	return [];
}

type Completion = { task: TodoistCompletedTask; epochMs: number };

type PagedFetch = { completions: Completion[]; complete: boolean; nextCursor: string | null; requests: number };

type ResumePoint = { since: number; until: number; cursor: string | null; restarts: number };

type ChunkedFetch = {
	completions: Completion[];
	completeThrough: number;
	chunkMs: number;
	resume: ResumePoint | null;
};

type CursorState = {
	cursor: number;
	seen: string[];
	floor: number;
	projectId: string | null | undefined;
	chunkMs: number;
	resume: ResumePoint | null;
};
