import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { assignTaskAction } from '../src/lib/actions/assign-task';
import { completeTaskByIdAction } from '../src/lib/actions/ai/complete-task-by-id';
import { deleteTaskByIdAction } from '../src/lib/actions/ai/delete-task-by-id';
import { createTasksAction } from '../src/lib/actions/create-tasks';
import { findTasksAction } from '../src/lib/actions/find-tasks';
import { getTaskAction } from '../src/lib/actions/get-task';
import { listTasksAction } from '../src/lib/actions/list-tasks';
import { moveTaskAction } from '../src/lib/actions/move-task';
import { reopenTaskAction } from '../src/lib/actions/reopen-task';
import { setTaskDateAction } from '../src/lib/actions/set-task-date';
import { setTaskFieldValueAction } from '../src/lib/actions/set-task-field-value';
import { setTaskNoteAction } from '../src/lib/actions/set-task-note';
import { unassignTaskAction } from '../src/lib/actions/unassign-task';
import { updateTaskAction } from '../src/lib/actions/update-task';
import { replies, run, SeenRequest, stubFetch } from './helpers';

const TASK = { id: 't1', text: 'Do it', parentId: 'root', completed: false };
const NORMALIZED = { id: 't1', text: 'Do it', parentId: 'root', completed: false, isRoot: false };
const NOT_FOUND = { status: 404, body: { ok: false, code: 'NOT_FOUND', message: 'Not Found' } };
const BAD_REQUEST = { status: 400, body: { ok: false, code: 'BAD_REQUEST', message: 'Bad Request' } };

function route(map: Record<string, { status?: number; body?: unknown }>) {
	return (request: SeenRequest) => map[`${request.method} ${request.path}`] ?? { status: 599, body: { ok: false, message: `unexpected ${request.method} ${request.path}` } };
}

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('list_tasks', () => {
	test('passes limit and cursor and flags the root node', async () => {
		const seen = stubFetch(() => ({ body: { ok: true, items: [{ id: 'r', text: 'Project' }, TASK], hasMore: true, nextCursor: 't1' } }));
		const result = await run(listTasksAction)({ projectId: 'P1', limit: 2, cursor: 'c0' });
		expect(Object.fromEntries(seen[0].query)).toEqual({ limit: '2', after: 'c0' });
		expect(result).toEqual({ items: [{ id: 'r', text: 'Project', parentId: null, completed: false, isRoot: true }, NORMALIZED], nextCursor: 't1', hasMore: true });
	});
	test('last page has no cursor', async () => {
		stubFetch(() => ({ body: { ok: true, items: [TASK], hasMore: false, nextCursor: null } }));
		await expect(run(listTasksAction)({ projectId: 'P1' })).resolves.toMatchObject({ nextCursor: null, hasMore: false });
	});
	test('limit over 1000 is refused', async () => {
		stubFetch(() => ({ body: {} }));
		await expect(run(listTasksAction)({ projectId: 'P1', limit: 1001 })).rejects.toThrow('between 1 and 1000');
	});
});

describe('find_tasks', () => {
	test('matches case-insensitively, skips the root and filters by status', async () => {
		stubFetch(() => ({
			body: {
				ok: true,
				items: [{ id: 'r', text: 'Invoice project' }, { ...TASK, id: 'a', text: 'Send INVOICE' }, { ...TASK, id: 'b', text: 'invoice paid', completed: true }],
				hasMore: false,
				nextCursor: null,
			},
		}));
		const result = await run(findTasksAction)({ projectId: 'P1', textContains: 'invoice', status: 'open' });
		expect(result).toMatchObject({ found: true, scanned: 3, truncated: false, nextCursor: null });
		expect(result).toHaveProperty('items', [expect.objectContaining({ id: 'a' })]);
	});
	test('stops after 5 pages of 1000 and returns a cursor', async () => {
		const page = Array.from({ length: 1000 }, (_, i) => ({ ...TASK, id: `t${i}`, text: 'x' }));
		const seen = stubFetch(() => ({ body: { ok: true, items: page, hasMore: true, nextCursor: 'next' } }));
		const result = await run(findTasksAction)({ projectId: 'P1', textContains: 'nomatch' });
		expect(seen).toHaveLength(5);
		expect(seen[0].query.get('limit')).toBe('1000');
		expect(result).toMatchObject({ found: false, scanned: 5000, truncated: true, nextCursor: 'next' });
	});
	test('max results cut mid-page returns the last match as cursor', async () => {
		stubFetch(() => ({ body: { ok: true, items: [{ ...TASK, id: 'a', text: 'hit' }, { ...TASK, id: 'b', text: 'hit' }, { ...TASK, id: 'c', text: 'hit' }], hasMore: false } }));
		const result = await run(findTasksAction)({ projectId: 'P1', textContains: 'hit', maxResults: 2 });
		expect(result).toMatchObject({ truncated: true, nextCursor: 'b' });
	});
});

describe('get_task', () => {
	test('missing date and note become null after the task is found', async () => {
		const seen = stubFetch(
			route({
				'GET /projects/P1/tasks/t1': { body: { ok: true, item: TASK } },
				'GET /projects/P1/tasks/t1/date': NOT_FOUND,
				'GET /projects/P1/tasks/t1/note': NOT_FOUND,
				'GET /projects/P1/tasks/t1/assignees': { body: { ok: true, items: [{ handle: 'pieces' }] } },
				'GET /projects/P1/tasks/t1/fields': { body: { ok: true, items: [{ fieldId: 'f1', value: 3 }] } },
			}),
		);
		const result = await run(getTaskAction)({ projectId: 'P1', taskId: 't1' });
		expect(result).toEqual({ ...NORMALIZED, date: null, note: null, assignees: [{ handle: 'pieces', displayName: null }], fields: [{ fieldId: 'f1', value: 3 }] });
		expect(seen).toHaveLength(5);
	});
	test('a missing task fails instead of returning empty details', async () => {
		const seen = stubFetch(() => NOT_FOUND);
		await expect(run(getTaskAction)({ projectId: 'P1', taskId: 't1' })).rejects.toThrow('404');
		expect(seen).toHaveLength(1);
	});
	test('details off makes one request', async () => {
		const seen = stubFetch(() => ({ body: { ok: true, item: TASK } }));
		await expect(run(getTaskAction)({ projectId: 'P1', taskId: 't1', includeDetails: false })).resolves.toEqual(NORMALIZED);
		expect(seen).toHaveLength(1);
	});
});

describe('create_tasks', () => {
	test('bottom placement keeps order', async () => {
		const seen = stubFetch(() => ({ body: { ok: true, item: [{ id: 'a', completed: false }, { id: 'b', completed: false }] } }));
		const result = await run(createTasksAction)({ projectId: 'P1', tasks: ['one', 'two'] });
		expect(seen[0].path).toBe('/projects/P1/tasks/');
		expect(seen[0].body).toEqual({
			tasks: [
				{ contentType: 'text/markdown', content: 'one', placement: 'beforeend' },
				{ contentType: 'text/markdown', content: 'two', placement: 'beforeend' },
			],
		});
		expect(result).toEqual({ items: [{ id: 'a', text: 'one', completed: false }, { id: 'b', text: 'two', completed: false }], count: 2 });
	});
	test('top placement sends reversed so the list reads in order, and reverses the result back', async () => {
		const seen = stubFetch(() => ({ body: { ok: true, item: [{ id: 'b' }, { id: 'a' }] } }));
		const result = await run(createTasksAction)({ projectId: 'P1', tasks: ['one', 'two'], position: 'top', format: 'text/plain' });
		expect(seen[0].body).toEqual({
			tasks: [
				{ contentType: 'text/plain', content: 'two', placement: 'afterbegin' },
				{ contentType: 'text/plain', content: 'one', placement: 'afterbegin' },
			],
		});
		expect(result).toMatchObject({ items: [{ id: 'a', text: 'one' }, { id: 'b', text: 'two' }] });
	});
	test.each([
		['before', 'beforebegin'],
		['after', 'afterend'],
		['first_child', 'afterbegin'],
		['last_child', 'beforeend'],
	])('%s uses %s with the anchor task', async (position, placement) => {
		const seen = stubFetch(() => ({ body: { ok: true, item: [{ id: 'a' }] } }));
		await run(createTasksAction)({ projectId: 'P1', tasks: ['one'], position, relativeToTaskId: 'anchor' });
		expect(seen[0].body).toEqual({ tasks: [{ contentType: 'text/markdown', content: 'one', placement, taskId: 'anchor' }] });
	});
	test.each([
		[{ tasks: [] }, 'at least one'],
		[{ tasks: Array.from({ length: 21 }, (_, i) => `t${i}`) }, 'at most 20'],
		[{ tasks: ['x'.repeat(2001)] }, 'at most 2000'],
		[{ tasks: ['a\nb'] }, 'single line'],
		[{ tasks: ['a'], position: 'after' }, 'Relative To Task ID is required'],
	])('refuses %j before any request', async (props, message) => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(run(createTasksAction)({ projectId: 'P1', ...props })).rejects.toThrow(message);
		expect(seen).toHaveLength(0);
	});
	test('accepts array items given as objects', async () => {
		const seen = stubFetch(() => ({ body: { ok: true, item: [{ id: 'a' }] } }));
		await run(createTasksAction)({ projectId: 'P1', tasks: [{ content: 'obj' }] });
		expect(seen[0].body).toMatchObject({ tasks: [{ content: 'obj' }] });
	});
});

describe('task writes', () => {
	test('update_task refuses newlines and re-reads a partial item', async () => {
		const seen = stubFetch(replies([{ body: { ok: true, item: { id: 't1' } } }, { body: { ok: true, item: TASK } }]));
		await expect(run(updateTaskAction)({ projectId: 'P1', taskId: 't1', text: 'a\nb' })).rejects.toThrow('single line');
		expect(seen).toHaveLength(0);
		await expect(run(updateTaskAction)({ projectId: 'P1', taskId: 't1', text: 'Do it' })).resolves.toEqual(NORMALIZED);
		expect(seen[0].method).toBe('PUT');
		expect(seen[0].body).toEqual({ contentType: 'text/markdown', content: 'Do it' });
		expect(seen[1].method).toBe('GET');
	});
	test('complete_task_by_id on an already completed task (400) succeeds', async () => {
		stubFetch(route({ 'POST /projects/P1/tasks/t1/complete': BAD_REQUEST, 'GET /projects/P1/tasks/t1': { body: { ok: true, item: { ...TASK, completed: true } } } }));
		await expect(run(completeTaskByIdAction)({ projectId: 'P1', taskId: 't1' })).resolves.toMatchObject({ completed: true });
	});
	test('complete_task_by_id rethrows a 400 when the task is still open', async () => {
		stubFetch(route({ 'POST /projects/P1/tasks/t1/complete': BAD_REQUEST, 'GET /projects/P1/tasks/t1': { body: { ok: true, item: TASK } } }));
		await expect(run(completeTaskByIdAction)({ projectId: 'P1', taskId: 't1' })).rejects.toThrow('400');
	});
	test('reopen_task on an open task (400) succeeds', async () => {
		stubFetch(route({ 'POST /projects/P1/tasks/t1/uncomplete': BAD_REQUEST, 'GET /projects/P1/tasks/t1': { body: { ok: true, item: TASK } } }));
		await expect(run(reopenTaskAction)({ projectId: 'P1', taskId: 't1' })).resolves.toMatchObject({ completed: false });
	});
	test('delete_task_by_id: 200 deletes, 404 is already deleted once the project is confirmed', async () => {
		stubFetch(() => ({ body: { ok: true } }));
		await expect(run(deleteTaskByIdAction)({ projectId: 'P1', taskId: 't1' })).resolves.toEqual({ projectId: 'P1', taskId: 't1', deleted: true, alreadyDeleted: false });
		const seen = stubFetch(route({ 'DELETE /projects/P1/tasks/t1': NOT_FOUND, 'GET /projects/P1': { body: { ok: true, item: { id: 'P1' } } } }));
		await expect(run(deleteTaskByIdAction)({ projectId: 'P1', taskId: 't1' })).resolves.toMatchObject({ alreadyDeleted: true });
		expect(seen.map((r) => r.method)).toEqual(['DELETE', 'GET']);
	});
	test('delete_task_by_id fails when the project itself is missing', async () => {
		stubFetch(() => NOT_FOUND);
		await expect(run(deleteTaskByIdAction)({ projectId: 'P1', taskId: 't1' })).rejects.toThrow('get project failed (404');
	});
	test('delete_task_by_id rethrows other errors', async () => {
		stubFetch(() => ({ status: 403, body: { ok: false, message: 'no' } }));
		await expect(run(deleteTaskByIdAction)({ projectId: 'P1', taskId: 't1' })).rejects.toThrow('403');
	});
	test('move_task maps positions and refuses moving next to itself', async () => {
		const seen = stubFetch(() => ({ body: { ok: true, item: TASK } }));
		await run(moveTaskAction)({ projectId: 'P1', taskId: 't1', targetTaskId: 't2', position: 'beforeend' });
		expect(seen[0].body).toEqual({ target: { taskId: 't2', position: 'beforeend' } });
		await run(moveTaskAction)({ projectId: 'P1', taskId: 't1', targetTaskId: 't2', position: 'before' });
		expect(seen[1].body).toEqual({ target: { taskId: 't2', position: 'beforebegin' } });
		await expect(run(moveTaskAction)({ projectId: 'P1', taskId: 't1', targetTaskId: 't1', position: 'afterend' })).rejects.toThrow('itself');
		await expect(run(moveTaskAction)({ projectId: 'P1', taskId: 't1', targetTaskId: 't2', position: 'sideways' })).rejects.toThrow('Position must be');
	});
});

describe('set_task_date', () => {
	test('date only', async () => {
		const seen = stubFetch(() => ({ body: { ok: true, item: { id: 't1' } } }));
		const result = await run(setTaskDateAction)({ projectId: 'P1', taskId: 't1', startDate: '2026-10-20' });
		expect(seen[0].body).toEqual({ start: { date: '2026-10-20' } });
		expect(result).toEqual({ projectId: 'P1', taskId: 't1', cleared: false, date: { start: { date: '2026-10-20' } } });
	});
	test('same-day range with the end time after the start time is sent', async () => {
		const seen = stubFetch(() => ({ body: { ok: true } }));
		await run(setTaskDateAction)({ projectId: 'P1', taskId: 't1', startDate: '2026-10-20', startTime: '09:00', endDate: '2026-10-20', endTime: '17:00' });
		expect(seen[0].body).toEqual({ start: { date: '2026-10-20', time: '09:00' }, end: { date: '2026-10-20', time: '17:00' } });
	});
	test('range with times and timezone', async () => {
		const seen = stubFetch(() => ({ body: { ok: true } }));
		await run(setTaskDateAction)({ projectId: 'P1', taskId: 't1', startDate: '2026-10-20', startTime: '09:30', endDate: '2026-10-21', endTime: '17:00:00', timezone: 'Europe/Berlin' });
		expect(seen[0].body).toEqual({
			start: { date: '2026-10-20', time: '09:30', timezone: 'Europe/Berlin' },
			end: { date: '2026-10-21', time: '17:00:00', timezone: 'Europe/Berlin' },
		});
	});
	test.each([
		[{}, 'Start Date is required'],
		[{ startDate: '20-10-2026' }, 'YYYY-MM-DD'],
		[{ startDate: '2026-13-01' }, 'YYYY-MM-DD'],
		[{ startDate: '2026-02-30' }, 'real date'],
		[{ startDate: '2026-10-20', endDate: '2026-04-31' }, 'real date'],
		[{ startDate: '2026-10-20', startTime: '9am' }, 'HH:MM'],
		[{ startDate: '2026-10-20', endTime: '10:00' }, 'End Time needs End Date'],
		[{ startDate: '2026-10-20', endDate: '2026-10-19' }, 'on or after'],
		[{ startDate: '2026-10-20', startTime: '17:00', endDate: '2026-10-20', endTime: '09:00' }, 'is before Start Time'],
		[{ startDate: '2026-10-20', startTime: '09:00:30', endDate: '2026-10-20', endTime: '09:00' }, 'is before Start Time'],
	])('refuses %j', async (props, message) => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(run(setTaskDateAction)({ projectId: 'P1', taskId: 't1', ...props })).rejects.toThrow(message);
		expect(seen).toHaveLength(0);
	});
	test('clear sends DELETE; "Date does not exist" (400) counts as cleared when the task exists', async () => {
		const seen = stubFetch(
			route({
				'DELETE /projects/P1/tasks/t1/date': { status: 400, body: { ok: false, code: 'BAD_REQUEST', message: 'Date does not exist' } },
				'GET /projects/P1/tasks/t1': { body: { ok: true, item: TASK } },
			}),
		);
		await expect(run(setTaskDateAction)({ projectId: 'P1', taskId: 't1', clearDate: true, startDate: 'ignored' })).resolves.toEqual({
			projectId: 'P1',
			taskId: 't1',
			cleared: true,
			date: null,
		});
		expect(seen.map((r) => r.method)).toEqual(['DELETE', 'GET']);
	});
	test('clear on a missing task fails', async () => {
		stubFetch(() => NOT_FOUND);
		await expect(run(setTaskDateAction)({ projectId: 'P1', taskId: 't1', clearDate: true })).rejects.toThrow('404');
	});
	test('a different 400 on clear is rethrown', async () => {
		stubFetch(() => BAD_REQUEST);
		await expect(run(setTaskDateAction)({ projectId: 'P1', taskId: 't1', clearDate: true })).rejects.toThrow('400');
	});
});

describe('set_task_note', () => {
	test('sets a single-line note', async () => {
		const seen = stubFetch(() => ({ body: { ok: true } }));
		await expect(run(setTaskNoteAction)({ projectId: 'P1', taskId: 't1', note: 'hello', format: 'text/plain' })).resolves.toMatchObject({
			note: { type: 'text/plain', value: 'hello' },
			cleared: false,
		});
		expect(seen[0].method).toBe('PUT');
		expect(seen[0].body).toEqual({ type: 'text/plain', value: 'hello' });
	});
	test('refuses newlines and empty notes', async () => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(run(setTaskNoteAction)({ projectId: 'P1', taskId: 't1', note: 'a\nb' })).rejects.toThrow('single line');
		await expect(run(setTaskNoteAction)({ projectId: 'P1', taskId: 't1', note: '' })).rejects.toThrow('Note is required');
		expect(seen).toHaveLength(0);
	});
	test('clear uses DELETE', async () => {
		const seen = stubFetch(() => ({ body: { ok: true } }));
		await expect(run(setTaskNoteAction)({ projectId: 'P1', taskId: 't1', clearNote: true })).resolves.toMatchObject({ cleared: true, note: null });
		expect(seen[0].method).toBe('DELETE');
	});
});

describe('assignees', () => {
	test('assign_task dedupes handles, strips @ and returns the full list', async () => {
		const seen = stubFetch(
			route({
				'PUT /projects/P1/tasks/t1/assignees': { body: { ok: true, item: { id: 't1' } } },
				'GET /projects/P1/tasks/t1': { body: { ok: true, item: TASK } },
				'GET /projects/P1/tasks/t1/assignees': { body: { ok: true, items: [{ handle: 'pieces', displayName: 'P' }] } },
			}),
		);
		const result = await run(assignTaskAction)({ projectId: 'P1', taskId: 't1', handles: ['@pieces', 'pieces', ' '] });
		expect(seen[0].body).toEqual({ handles: ['pieces'] });
		expect(result).toEqual({ ...NORMALIZED, assignees: [{ handle: 'pieces', displayName: 'P' }] });
	});
	test('assign_task refuses an empty list', async () => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(run(assignTaskAction)({ projectId: 'P1', taskId: 't1', handles: [] })).rejects.toThrow('at least one');
		expect(seen).toHaveLength(0);
	});
	test('unassign_task: a 400 for someone not assigned reports wasAssigned false', async () => {
		stubFetch(
			route({
				'DELETE /projects/P1/tasks/t1/assignees/pieces': BAD_REQUEST,
				'GET /projects/P1/tasks/t1': { body: { ok: true, item: TASK } },
				'GET /projects/P1/tasks/t1/assignees': { body: { ok: true, items: [] } },
			}),
		);
		await expect(run(unassignTaskAction)({ projectId: 'P1', taskId: 't1', handle: '@pieces' })).resolves.toEqual({
			...NORMALIZED,
			removedHandle: 'pieces',
			wasAssigned: false,
		});
	});
	test('unassign_task rethrows a 400 when the person is still assigned', async () => {
		stubFetch(
			route({
				'DELETE /projects/P1/tasks/t1/assignees/pieces': BAD_REQUEST,
				'GET /projects/P1/tasks/t1': { body: { ok: true, item: TASK } },
				'GET /projects/P1/tasks/t1/assignees': { body: { ok: true, items: [{ handle: 'pieces' }] } },
			}),
		);
		await expect(run(unassignTaskAction)({ projectId: 'P1', taskId: 't1', handle: 'pieces' })).rejects.toThrow('400');
	});
});

describe('set_task_field_value', () => {
	const fields = {
		ok: true,
		items: [
			{ id: 'num', data: { type: 'number', displayName: 'Points' } },
			{ id: 'sel', data: { type: 'Select', displayName: 'Status', options: { x: { id: 'o1', name: 'Open', rank: 'a' } } } },
			{ id: 'txt', data: { type: 'string', displayName: 'Notes' } },
		],
	};
	function server() {
		return stubFetch((request) => (request.method === 'GET' ? { body: fields } : { body: { ok: true } }));
	}
	test('number fields get a number', async () => {
		const seen = server();
		await expect(run(setTaskFieldValueAction)({ projectId: 'P1', taskId: 't1', fieldId: 'num', value: '5' })).resolves.toMatchObject({ value: 5 });
		expect(seen[1].path).toBe('/projects/P1/tasks/t1/fields/num');
		expect(seen[1].body).toEqual({ value: 5 });
	});
	test('select fields accept an option name and send its id', async () => {
		const seen = server();
		await run(setTaskFieldValueAction)({ projectId: 'P1', taskId: 't1', fieldId: 'sel', value: 'open' });
		expect(seen[1].body).toEqual({ value: 'o1' });
	});
	test.each([
		[{ fieldId: 'num', value: 'abc' }, 'must be a number'],
		[{ fieldId: 'sel', value: 'Closed' }, 'not an option'],
		[{ fieldId: 'nope', value: '1' }, 'no custom field with ID "nope"'],
		[{ fieldId: 'nope', clearValue: true }, 'no custom field with ID "nope"'],
		[{ fieldId: 'txt' }, 'Value is required'],
	])('refuses %j without writing', async (props, message) => {
		const seen = server();
		await expect(run(setTaskFieldValueAction)({ projectId: 'P1', taskId: 't1', ...props })).rejects.toThrow(message);
		expect(seen.filter((r) => r.method !== 'GET')).toHaveLength(0);
	});
	test('clear sends DELETE for a known field', async () => {
		const seen = server();
		await expect(run(setTaskFieldValueAction)({ projectId: 'P1', taskId: 't1', fieldId: 'txt', clearValue: true })).resolves.toMatchObject({ cleared: true, value: null });
		expect(seen[1].method).toBe('DELETE');
	});
});
