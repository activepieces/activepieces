import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'p1' },
}));

import {
  ResourceRef,
  resourceRegistry,
} from '@/features/chat/lib/resources/registry';

const tagged = (apResource: unknown) => ({
  content: [{ type: 'text', text: 'done' }],
  _meta: { apResource },
});

describe('resourceRegistry.resolve', () => {
  it('reads the resource from the tool result meta', () => {
    const output = tagged({
      v: 1,
      kind: 'table',
      id: 't1',
      projectId: 'p1',
      op: 'update',
      label: 'Leads',
    });
    expect(resourceRegistry.resolve(output)).toEqual({
      ref: { kind: 'table', id: 't1', projectId: 'p1', name: 'Leads' },
      op: 'update',
    });
    expect(resourceRegistry.resolve(JSON.stringify(output))).toEqual({
      ref: { kind: 'table', id: 't1', projectId: 'p1', name: 'Leads' },
      op: 'update',
    });
  });

  it('ignores results without a valid meta', () => {
    expect(
      resourceRegistry.resolve({ content: [{ type: 'text', text: 'ok' }] }),
    ).toBeNull();
    expect(
      resourceRegistry.resolve(tagged({ v: 2, kind: 'table', id: 't1' })),
    ).toBeNull();
    expect(resourceRegistry.resolve('not json')).toBeNull();
  });
});

describe('resourceRegistry routes', () => {
  it('builds routes in the resource project', () => {
    expect(
      resourceRegistry.route({
        kind: 'flow',
        id: 'f1',
        projectId: 'p2',
        name: 'Flow',
      }),
    ).toBe('/projects/p2/flows/f1');
    expect(
      resourceRegistry.parentRoute({
        kind: 'table',
        id: 't1',
        projectId: 'p2',
        name: 'Leads',
      }),
    ).toBe('/projects/p2/automations');
  });

  it('matches the resource page and its sub-pages only', () => {
    const ref: ResourceRef = {
      kind: 'flow',
      id: 'f1',
      projectId: 'p',
      name: 'Flow',
    };
    expect(
      resourceRegistry.isOn({ pathname: '/projects/p/flows/f1', ref }),
    ).toBe(true);
    expect(
      resourceRegistry.isOn({ pathname: '/projects/p/flows/f1/runs', ref }),
    ).toBe(true);
    expect(
      resourceRegistry.isOn({ pathname: '/projects/p/flows/f12', ref }),
    ).toBe(false);
    expect(
      resourceRegistry.isOn({
        pathname: '/projects/p/flows/f1',
        ref: { ...ref, projectId: 'other' },
      }),
    ).toBe(false);
  });
});

const table: ResourceRef = {
  kind: 'table',
  id: 't1',
  projectId: 'p1',
  name: 'Leads',
};
const flow: ResourceRef = {
  kind: 'flow',
  id: 'f1',
  projectId: 'p1',
  name: 'Flow',
};

describe('resourceRegistry.queryKeys', () => {
  it('refreshes the open table and its list rows when the chat edits a table', () => {
    expect(resourceRegistry.queryKeys({ ref: table, op: 'update' })).toEqual([
      ['tables'],
      ['root-tables'],
      ['all-folder-contents'],
      ['table', 't1'],
      ['fields', 't1'],
      ['folders'],
    ]);
  });

  it('refreshes flow lists and folders when the chat edits or moves a flow', () => {
    expect(resourceRegistry.queryKeys({ ref: flow, op: 'update' })).toEqual([
      ['flows'],
      ['root-flows'],
      ['all-folder-contents'],
      ['folders'],
    ]);
  });

  it('also refreshes folders when a resource is created or deleted', () => {
    expect(resourceRegistry.queryKeys({ ref: flow, op: 'create' })).toEqual([
      ['flows'],
      ['root-flows'],
      ['all-folder-contents'],
      ['folders'],
    ]);
    expect(resourceRegistry.queryKeys({ ref: table, op: 'delete' })).toEqual([
      ['tables'],
      ['root-tables'],
      ['all-folder-contents'],
      ['folders'],
    ]);
  });

  it('only treats resources of the current project as local', () => {
    expect(resourceRegistry.isInCurrentProject(table)).toBe(true);
    expect(
      resourceRegistry.isInCurrentProject({ ...table, projectId: 'p2' }),
    ).toBe(false);
  });
});
