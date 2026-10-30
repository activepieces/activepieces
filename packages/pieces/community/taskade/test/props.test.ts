import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { taskadeProps } from '../src/lib/common/props';
import { runStep, SERVER, stubFetch, taskadeConnection } from './helpers';

const ctx = { server: SERVER, project: { id: 'p', externalId: () => undefined }, flows: {}, step: { name: 's' } };

function options({ prop, propsValue }: { prop: { options: (propsValue: never, context: never) => Promise<unknown> }; propsValue: Record<string, unknown> }) {
	return runStep(Reflect.apply(prop.options, prop, [{ auth: taskadeConnection(), ...propsValue }, ctx]));
}

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('task dropdown', () => {
	test('follows nextCursor until hasMore is false and labels the root', async () => {
		const seen = stubFetch((_request, index) =>
			index === 0
				? { body: { ok: true, items: [{ id: 'r', text: 'Proj' }, { id: 'a', text: 'A', parentId: 'r' }], hasMore: true, nextCursor: 'a' } }
				: { body: { ok: true, items: [{ id: 'b', text: '', parentId: 'r' }], hasMore: false, nextCursor: null } },
		);
		const result = await options({ prop: taskadeProps.task_id, propsValue: { project_id: 'P1' } });
		expect(seen).toHaveLength(2);
		expect(seen[0].query.get('limit')).toBe('1000');
		expect(seen[1].query.get('after')).toBe('a');
		expect(result).toMatchObject({
			disabled: false,
			options: [
				{ label: 'Proj (project root)', value: 'r' },
				{ label: 'A', value: 'a' },
				{ label: '(empty task)', value: 'b' },
			],
		});
	});
	test('caps at 10 pages and says so', async () => {
		const seen = stubFetch((_request, index) => ({ body: { ok: true, items: [{ id: `t${index}`, text: 'x', parentId: 'r' }], hasMore: true, nextCursor: `t${index}` } }));
		const result = await options({ prop: taskadeProps.task_id, propsValue: { project_id: 'P1' } });
		expect(seen).toHaveLength(10);
		expect(result).toMatchObject({ disabled: false, placeholder: expect.stringContaining('first 10000 tasks') });
	});
	test('errors become a disabled dropdown with a reason', async () => {
		stubFetch(() => ({ status: 401, body: { ok: false, message: 'Unauthorized' } }));
		await expect(options({ prop: taskadeProps.task_id, propsValue: { project_id: 'P1' } })).resolves.toMatchObject({ disabled: true, placeholder: expect.stringContaining('Reconnect') });
		stubFetch(() => ({ status: 500, body: { ok: false, message: 'boom' } }));
		await expect(options({ prop: taskadeProps.workspace_id, propsValue: {} })).resolves.toMatchObject({ disabled: true, placeholder: expect.stringContaining('boom') });
	});
	test('429 after retries is explained', async () => {
		stubFetch(() => ({ status: 429, body: { ok: false } }));
		await expect(options({ prop: taskadeProps.folder_id, propsValue: { workspace_id: 'W' } })).resolves.toMatchObject({ disabled: true, placeholder: expect.stringContaining('rate limit') });
	});
	test('project dropdown falls back to the workspace home folder', async () => {
		const seen = stubFetch(() => ({ body: { ok: true, items: [{ id: 'P1', name: 'Plan' }] } }));
		await expect(options({ prop: taskadeProps.project_id, propsValue: { workspace_id: 'W' } })).resolves.toMatchObject({ options: [{ label: 'Plan', value: 'P1' }] });
		expect(seen[0].path).toBe('/folders/W/projects');
	});
	test('missing parents disable the dropdown without a request', async () => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(options({ prop: taskadeProps.task_id, propsValue: {} })).resolves.toMatchObject({ disabled: true });
		await expect(options({ prop: taskadeProps.folder_id, propsValue: {} })).resolves.toMatchObject({ disabled: true });
		expect(seen).toHaveLength(0);
	});
});
