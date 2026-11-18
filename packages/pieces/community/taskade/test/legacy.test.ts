import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { completeTaskAction } from '../src/lib/actions/complete-task.action';
import { createTaskAction } from '../src/lib/actions/create-task.action';
import { deleteTaskAction } from '../src/lib/actions/delete-task.action';
import { run, SeenRequest, stubFetch } from './helpers';

const TASK = { id: 't1', text: 'Do it', parentId: 'root', completed: true };

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('existing actions keep their names, props and output shape', () => {
	test('names and props are unchanged', () => {
		expect(createTaskAction.name).toBe('taskade-create-task');
		expect(completeTaskAction.name).toBe('taskade-complete-task');
		expect(deleteTaskAction.name).toBe('taskade-delete-task');
		expect(Object.keys(createTaskAction.props)).toEqual(['workspace_id', 'folder_id', 'project_id', 'content_type', 'content', 'placement']);
		expect(Object.keys(completeTaskAction.props)).toEqual(['workspace_id', 'folder_id', 'project_id', 'task_id']);
		expect(Object.keys(deleteTaskAction.props)).toEqual(['workspace_id', 'folder_id', 'project_id', 'task_id']);
	});
	test('create-task sends the original body and returns the raw envelope', async () => {
		const seen = stubFetch(() => ({ body: { ok: true, item: [{ id: 'a', completed: false }] } }));
		const result = await run(createTaskAction)({ project_id: 'P1', content_type: 'text/markdown', content: 'Hello', placement: 'afterbegin' });
		expect(seen[0].path).toBe('/projects/P1/tasks');
		expect(seen[0].body).toEqual({ tasks: [{ content: 'Hello', contentType: 'text/markdown', placement: 'afterbegin' }] });
		expect(result).toEqual({ ok: true, item: [{ id: 'a', completed: false }] });
	});
	test('create-task refuses content over 2000 characters', async () => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(run(createTaskAction)({ project_id: 'P1', content_type: 'text/plain', content: 'x'.repeat(2001), placement: 'beforeend' })).rejects.toThrow('2000');
		expect(seen).toHaveLength(0);
	});
	test('complete-task returns ok + item, also when the task was already completed', async () => {
		stubFetch((request: SeenRequest) => (request.method === 'POST' ? { status: 400, body: { ok: false, message: 'Bad Request' } } : { body: { ok: true, item: TASK } }));
		await expect(run(completeTaskAction)({ project_id: 'P1', task_id: 't1' })).resolves.toEqual({ ok: true, item: TASK });
	});
	test('delete-task is idempotent: 404 after confirming the project', async () => {
		stubFetch(() => ({ body: { ok: true } }));
		await expect(run(deleteTaskAction)({ project_id: 'P1', task_id: 't1' })).resolves.toEqual({ ok: true, alreadyDeleted: false });
		const seen = stubFetch((request: SeenRequest) => (request.method === 'DELETE' ? { status: 404, body: { ok: false, message: 'Not Found' } } : { body: { ok: true, item: { id: 'P1' } } }));
		await expect(run(deleteTaskAction)({ project_id: 'P1', task_id: 't1' })).resolves.toEqual({ ok: true, alreadyDeleted: true });
		expect(seen[1].path).toBe('/projects/P1');
	});
	test('delete-task fails when the project is missing', async () => {
		stubFetch(() => ({ status: 404, body: { ok: false, message: 'Document not found' } }));
		await expect(run(deleteTaskAction)({ project_id: 'P1', task_id: 't1' })).rejects.toThrow('Document not found');
	});
});
