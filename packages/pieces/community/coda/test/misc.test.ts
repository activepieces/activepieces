import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { listFormulasAction } from '../src/lib/actions/list-formulas';
import { getFormulaAction } from '../src/lib/actions/get-formula';
import { listControlsAction } from '../src/lib/actions/list-controls';
import { getControlAction } from '../src/lib/actions/get-control';
import { getMutationStatusAction } from '../src/lib/actions/get-mutation-status';
import { resolveBrowserLinkAction } from '../src/lib/actions/ai/resolve-browser-link';
import { listPermissionsAction } from '../src/lib/actions/list-permissions';
import { addPermissionAction } from '../src/lib/actions/add-permission';
import { removePermissionAction } from '../src/lib/actions/remove-permission';
import { triggerAutomationAction } from '../src/lib/actions/trigger-automation';
import { coda } from '../src';
import { run, stubFetch } from './helpers';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('formulas and controls', () => {
	test.each([
		[listFormulasAction, '/docs/d/formulas'],
		[listControlsAction, '/docs/d/controls'],
	])('%# list path', async (action, path) => {
		const seen = stubFetch(() => ({ body: { items: [] } }));
		await run(action)({ docId: 'd' });
		expect(seen[0].path).toBe(path);
	});
	test('get formula by name', async () => {
		const seen = stubFetch(() => ({ body: { id: 'f-1', value: 35.5 } }));
		await expect(run(getFormulaAction)({ docId: 'd', formulaIdOrName: 'Total Amount' })).resolves.toEqual({ id: 'f-1', value: 35.5 });
		expect(seen[0].url).toContain('/docs/d/formulas/Total%20Amount');
	});
	test('get control', async () => {
		const seen = stubFetch(() => ({ body: { id: 'ctrl-1', value: 0 } }));
		await run(getControlAction)({ docId: 'd', controlIdOrName: 'ctrl-1' });
		expect(seen[0].path).toBe('/docs/d/controls/ctrl-1');
	});
});

describe('get_mutation_status', () => {
	test('returns completed and warning', async () => {
		const seen = stubFetch(() => ({ body: { completed: true } }));
		await expect(run(getMutationStatusAction)({ requestId: ' mutate:1 ' })).resolves.toEqual({ requestId: 'mutate:1', completed: true, warning: null });
		expect(seen[0].path).toBe('/mutationStatus/mutate%3A1');
	});
});

describe('resolve_browser_link', () => {
	test('derives doc and table ids', async () => {
		const seen = stubFetch(() => ({
			body: {
				browserLink: 'https://docs.superhuman.com/d/_dD1#_tugrid-1/_rui-1',
				resource: { type: 'row', id: 'i-1', href: 'https://coda.io/apis/v1/docs/D1/tables/grid-1/rows/i-1' },
			},
		}));
		const result = await run(resolveBrowserLinkAction)({ url: 'https://docs.superhuman.com/d/_dD1#_tugrid-1/_rui-1' });
		expect(result).toEqual({
			resourceType: 'row',
			id: 'i-1',
			name: null,
			docId: 'D1',
			tableId: 'grid-1',
			browserLink: 'https://docs.superhuman.com/d/_dD1#_tugrid-1/_rui-1',
		});
		expect(seen[0].path).toBe('/resolveBrowserLink');
		expect(seen[0].query.get('degradeGracefully')).toBe('true');
	});
	test('refuses non-Coda links', async () => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(run(resolveBrowserLinkAction)({ url: 'https://coda.io.evil.io/d/x' })).rejects.toThrow();
		await expect(run(resolveBrowserLinkAction)({ url: 'http://coda.io/d/x' })).rejects.toThrow();
		expect(seen).toHaveLength(0);
	});
});

describe('sharing', () => {
	test('list', async () => {
		const seen = stubFetch(() => ({ body: { items: [{ id: 'p1' }] } }));
		await expect(run(listPermissionsAction)({ docId: 'd' })).resolves.toEqual({ items: [{ id: 'p1' }], nextPageToken: null, hasMore: false });
		expect(seen[0].path).toBe('/docs/d/acl/permissions');
	});
	test('share with an email then look up the permission id', async () => {
		const seen = stubFetch((request) =>
			request.method === 'POST'
				? { body: {} }
				: { body: { items: [{ id: 'p-other', principal: { type: 'email', email: 'x@y.z' } }, { id: 'p-1', access: 'readonly', principal: { type: 'email', email: 'Ada@Example.com' } }] } },
		);
		const result = await run(addPermissionAction)({ docId: 'd', principalType: 'email', principal: 'ada@example.com', access: 'readonly', suppressEmail: true });
		expect(seen[0].body).toEqual({ access: 'readonly', principal: { type: 'email', email: 'ada@example.com' }, suppressEmail: true });
		expect(result).toEqual({ docId: 'd', permissionId: 'p-1', principalType: 'email', principal: 'ada@example.com', access: 'readonly' });
	});
	test.each([
		['email', 'not-an-email'],
		['domain', 'nodot'],
		['anyone', 'x'],
	])('refuses %s %s', async (principalType, principal) => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(run(addPermissionAction)({ docId: 'd', principalType, principal, access: 'readonly' })).rejects.toThrow();
		expect(seen).toHaveLength(0);
	});
	test('remove; 404 means already removed', async () => {
		const seen = stubFetch(() => ({ status: 404, body: { message: 'gone' } }));
		await expect(run(removePermissionAction)({ docId: 'd', permissionId: 'p-1' })).resolves.toEqual({
			docId: 'd',
			permissionId: 'p-1',
			removed: true,
			alreadyRemoved: true,
		});
		expect(seen[0].method).toBe('DELETE');
		expect(seen[0].path).toBe('/docs/d/acl/permissions/p-1');
	});
});

describe('trigger_automation', () => {
	test('posts the payload', async () => {
		const seen = stubFetch(() => ({ status: 202, body: { requestId: 'r' } }));
		await expect(run(triggerAutomationAction)({ docId: 'd', ruleId: 'grid-auto-1', payload: { a: 1 } })).resolves.toEqual({ ruleId: 'grid-auto-1', requestId: 'r' });
		expect(seen[0].path).toBe('/docs/d/hooks/automation/grid-auto-1');
		expect(seen[0].body).toEqual({ a: 1 });
	});
});

describe('piece metadata', () => {
	test('every action is tagged and new names are unique', () => {
		const actions = Object.values(coda.actions());
		expect(actions).toHaveLength(41);
		for (const action of actions) {
			expect(action.audience, action.name).toBeDefined();
			expect(action.classification, action.name).toBeDefined();
			if (action.name !== 'custom_api_call') {
				expect(action.aiMetadata?.description, action.name).toBeTruthy();
				expect(action.outputSchema, action.name).toBeDefined();
			}
		}
		const byAudience = actions.reduce<Record<string, number>>((acc, action) => ({ ...acc, [String(action.audience)]: (acc[String(action.audience)] ?? 0) + 1 }), {});
		expect(byAudience).toEqual({ human: 8, both: 27, ai: 6 });
	});
});
