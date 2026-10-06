import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { completeProjectAction } from '../src/lib/actions/complete-project';
import { copyProjectAction } from '../src/lib/actions/copy-project';
import { createProjectAction } from '../src/lib/actions/create-project';
import { createProjectFromTemplateAction } from '../src/lib/actions/create-project-from-template';
import { getProjectAction } from '../src/lib/actions/get-project';
import { getProjectShareLinkAction } from '../src/lib/actions/get-project-share-link';
import { listFoldersAction } from '../src/lib/actions/list-folders';
import { listProjectFieldsAction } from '../src/lib/actions/list-project-fields';
import { listProjectMembersAction } from '../src/lib/actions/list-project-members';
import { listProjectTemplatesAction } from '../src/lib/actions/list-project-templates';
import { listProjectsAction } from '../src/lib/actions/list-projects';
import { listRecentProjectsAction } from '../src/lib/actions/list-recent-projects';
import { listWorkspacesAction } from '../src/lib/actions/list-workspaces';
import { restoreProjectAction } from '../src/lib/actions/restore-project';
import { replies, run, stubFetch } from './helpers';

const PROJECT = { id: 'P1', name: 'Plan', icon: { type: 'emoji', value: '📝' }, completed: false };
const NORMALIZED = { id: 'P1', name: 'Plan', icon: '📝', completed: false, url: 'https://www.taskade.com/d/P1' };

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('workspaces and folders', () => {
	test('list_workspaces', async () => {
		const seen = stubFetch(() => ({ body: { ok: true, items: [{ id: 'W', name: 'Workspace' }, null] } }));
		await expect(run(listWorkspacesAction)({})).resolves.toEqual({ items: [{ id: 'W', name: 'Workspace' }] });
		expect(seen[0].path).toBe('/workspaces');
	});
	test('list_folders encodes the workspace id', async () => {
		const seen = stubFetch(() => ({ body: { ok: true, items: [{ id: 'W', name: 'Home' }] } }));
		await run(listFoldersAction)({ workspaceId: 'W/../x' });
		expect(seen[0].url).toBe('https://www.taskade.com/api/v1/workspaces/W%2F..%2Fx/folders');
	});
});

describe('projects', () => {
	test('list_projects filters by name and archived state', async () => {
		stubFetch(() => ({
			body: { ok: true, items: [PROJECT, { id: 'P2', name: 'Old plan', completed: true }, { id: 'P3', name: 'Other' }, null] },
		}));
		const result = await run(listProjectsAction)({ folderId: 'W', nameContains: 'PLAN', includeCompleted: false });
		expect(result).toEqual({ items: [NORMALIZED] });
	});
	test('list_recent_projects passes paging and reports hasMore from a full page', async () => {
		const seen = stubFetch(() => ({ body: { ok: true, items: [PROJECT, PROJECT] } }));
		const result = await run(listRecentProjectsAction)({ limit: 2, page: 3, sort: 'viewed-asc' });
		expect(Object.fromEntries(seen[0].query)).toEqual({ limit: '2', page: '3', sort: 'viewed-asc' });
		expect(result).toMatchObject({ page: 3, nextPage: 4, hasMore: true });
	});
	test('list_recent_projects refuses a limit over 100', async () => {
		stubFetch(() => ({ body: {} }));
		await expect(run(listRecentProjectsAction)({ limit: 500 })).rejects.toThrow('between 1 and 100');
	});
	test('get_project accepts a project link', async () => {
		const seen = stubFetch(() => ({ body: { ok: true, item: PROJECT } }));
		await expect(run(getProjectAction)({ projectId: 'https://www.taskade.com/d/P1' })).resolves.toEqual(NORMALIZED);
		expect(seen[0].path).toBe('/projects/P1');
	});
	test('get_project refuses a lookalike host before any request', async () => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(run(getProjectAction)({ projectId: 'https://www.taskade.com.evil.io/d/P1' })).rejects.toThrow('not a Taskade project link');
		expect(seen).toHaveLength(0);
	});
	test('create_project sends a markdown title and body and fills the missing name', async () => {
		const seen = stubFetch(() => ({ body: { ok: true, item: { id: 'P9', icon: null } } }));
		const result = await run(createProjectAction)({ folderId: 'W', title: 'AP-TEST', content: '- a\n- b' });
		expect(seen[0].method).toBe('POST');
		expect(seen[0].body).toEqual({ folderId: 'W', contentType: 'text/markdown', content: '# AP-TEST\n\n- a\n- b' });
		expect(result).toMatchObject({ id: 'P9', name: 'AP-TEST', url: 'https://www.taskade.com/d/P9' });
	});
	test('create_project refuses a multi-line title', async () => {
		stubFetch(() => ({ body: {} }));
		await expect(run(createProjectAction)({ folderId: 'W', title: 'a\nb' })).rejects.toThrow('single line');
	});
	test('create_project_from_template re-reads the project when the name is missing', async () => {
		const seen = stubFetch(replies([{ body: { ok: true, item: { id: 'P9' } } }, { body: { ok: true, item: { ...PROJECT, id: 'P9' } } }]));
		const result = await run(createProjectFromTemplateAction)({ folderId: 'W', templateId: 'T1' });
		expect(seen[0].body).toEqual({ folderId: 'W', templateId: 'T1' });
		expect(seen[1].path).toBe('/projects/P9');
		expect(result).toMatchObject({ id: 'P9', name: 'Plan' });
	});
	test('copy_project omits an empty title', async () => {
		const seen = stubFetch(() => ({ body: { ok: true, item: { ...PROJECT, id: 'P2' } } }));
		await run(copyProjectAction)({ projectId: 'P1', folderId: 'W', projectTitle: '  ' });
		expect(seen[0].path).toBe('/projects/P1/copy');
		expect(seen[0].body).toEqual({ folderId: 'W' });
		expect(seen).toHaveLength(1);
	});
	test('complete_project re-reads the project and reports it completed', async () => {
		const seen = stubFetch(replies([{ body: { ok: true, item: { id: 'P1' } } }, { body: { ok: true, item: PROJECT } }]));
		await expect(run(completeProjectAction)({ projectId: 'P1' })).resolves.toEqual({ ...NORMALIZED, completed: true });
		expect(seen.map((r) => `${r.method} ${r.path}`)).toEqual(['POST /projects/P1/complete', 'GET /projects/P1']);
	});
	test('restore_project reports it active', async () => {
		stubFetch(replies([{ body: { ok: true, item: null } }, { body: { ok: true, item: { ...PROJECT, completed: true } } }]));
		await expect(run(restoreProjectAction)({ projectId: 'P1' })).resolves.toMatchObject({ completed: false });
	});
	test('list_project_templates and members page', async () => {
		const seen = stubFetch(() => ({ body: { ok: true, items: [{ id: 'T1', name: 'Sprint' }, null] } }));
		await expect(run(listProjectTemplatesAction)({ folderId: 'W' })).resolves.toEqual({ items: [{ id: 'T1', name: 'Sprint' }], page: 1, nextPage: null, hasMore: false });
		expect(seen[0].query.get('limit')).toBe('20');
		stubFetch(() => ({ body: { ok: true, items: [{ id: 'T1', name: 'Sprint' }, null] } }));
		await expect(run(listProjectTemplatesAction)({ folderId: 'W', limit: 2 })).resolves.toMatchObject({ items: [{ id: 'T1' }], nextPage: 2, hasMore: true });
		stubFetch(() => ({ body: { ok: true, items: [{ handle: 'pieces', displayName: 'P' }, null] } }));
		await expect(run(listProjectMembersAction)({ projectId: 'P1', limit: 2 })).resolves.toMatchObject({ items: [{ handle: 'pieces' }], nextPage: 2, hasMore: true });
		stubFetch(() => ({ body: { ok: true, items: [{ handle: 'pieces', displayName: 'P' }] } }));
		await expect(run(listProjectMembersAction)({ projectId: 'P1', limit: 1 })).resolves.toEqual({
			items: [{ handle: 'pieces', displayName: 'P' }],
			page: 1,
			nextPage: 2,
			hasMore: true,
		});
	});
	test('list_project_fields normalizes select options', async () => {
		stubFetch(() => ({
			body: {
				ok: true,
				items: [
					{ id: 'f1', data: { type: 'Select', displayName: 'Status', options: { a: { id: 'o1', name: 'Open', rank: 'a' } } } },
					{ id: 'f2', data: { type: 'Assign', title: 'Owner' } },
				],
			},
		}));
		const result = await run(listProjectFieldsAction)({ projectId: 'P1' });
		expect(result).toMatchObject({
			items: [
				{ id: 'f1', type: 'Select', displayName: 'Status', options: [{ id: 'o1', name: 'Open' }] },
				{ id: 'f2', type: 'Assign', displayName: 'Owner', options: [] },
			],
		});
	});
	test('get_project_share_link reports enabled false for a null item', async () => {
		stubFetch(() => ({ body: { ok: true, item: null } }));
		await expect(run(getProjectShareLinkAction)({ projectId: 'P1' })).resolves.toEqual({
			projectId: 'P1',
			enabled: false,
			viewUrl: null,
			editUrl: null,
			checkUrl: null,
		});
	});
});
