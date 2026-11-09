import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: {
    getProjectId: () => 'current-project',
    appendProjectRoutePrefix: (path: string) =>
      `/projects/current-project${path}`,
  },
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
  it('builds project-aware routes, falling back to the current project', () => {
    expect(
      resourceRegistry.route({ kind: 'table', id: 't1', name: 'Leads' }),
    ).toBe('/projects/current-project/tables/t1');
    expect(
      resourceRegistry.route({
        kind: 'flow',
        id: 'f1',
        projectId: 'p2',
        name: 'Flow',
      }),
    ).toBe('/projects/p2/flows/f1');
    expect(
      resourceRegistry.parentRoute({ kind: 'table', id: 't1', name: 'Leads' }),
    ).toBe('/projects/current-project/automations');
  });

  it('matches the resource page and its sub-pages only', () => {
    const ref: ResourceRef = { kind: 'flow', id: 'f1', name: 'Flow' };
    expect(resourceRegistry.isOn('/projects/p/flows/f1', ref)).toBe(true);
    expect(resourceRegistry.isOn('/projects/p/flows/f1/runs', ref)).toBe(true);
    expect(resourceRegistry.isOn('/projects/p/flows/f12', ref)).toBe(false);
    expect(
      resourceRegistry.isOn('/projects/p/flows/f1', {
        ...ref,
        projectId: 'other',
      }),
    ).toBe(false);
  });
});
