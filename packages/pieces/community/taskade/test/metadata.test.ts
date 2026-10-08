import { describe, expect, test } from 'vitest';
import { taskade } from '../src';

const actions = Object.values(taskade.actions());
const nonCustom = actions.filter((action) => action.name !== 'custom_api_call');

describe('piece metadata', () => {
	test('42 actions and 6 triggers', () => {
		expect(actions).toHaveLength(42);
		expect(Object.keys(taskade.triggers())).toHaveLength(6);
	});
	test.each(nonCustom.map((action) => [action.name, action]))('%s declares audience, classification, aiMetadata and outputSchema', (_name, action) => {
		expect(['both', 'ai', 'human']).toContain(action.audience);
		expect(['READ', 'SEARCH', 'WRITE', 'DESTRUCTIVE']).toContain(action.classification);
		expect(action.aiMetadata?.description?.length ?? 0).toBeGreaterThan(60);
		expect(typeof action.aiMetadata?.idempotent).toBe('boolean');
		expect(action.outputSchema?.fields.length).toBeGreaterThan(0);
	});
	test('dropdown actions are human-only and their AI twins take IDs as text', () => {
		const byName = Object.fromEntries(actions.map((action) => [action.name, action]));
		expect(byName['taskade-create-task'].audience).toBe('human');
		expect(byName['taskade-complete-task'].audience).toBe('human');
		expect(byName['taskade-delete-task'].audience).toBe('human');
		expect(byName['complete_task_by_id'].audience).toBe('ai');
		expect(byName['delete_task_by_id'].audience).toBe('ai');
		const aiVisible = actions.filter((action) => action.audience !== 'human' && action.name !== 'custom_api_call');
		for (const action of aiVisible) {
			const types = Object.values(action.props).map((prop: unknown) => (prop !== null && typeof prop === 'object' ? Reflect.get(prop, 'type') : undefined));
			expect(types).not.toContain('DROPDOWN');
		}
	});
	test('destructive actions are the deletes', () => {
		expect(nonCustom.filter((action) => action.classification === 'DESTRUCTIVE').map((action) => action.name).sort()).toEqual([
			'delete_agent',
			'delete_task_by_id',
			'taskade-delete-task',
		]);
	});
	test('minimum release supports ai audience', () => {
		expect(taskade.minimumSupportedRelease).toBe('0.88.2');
	});
});
