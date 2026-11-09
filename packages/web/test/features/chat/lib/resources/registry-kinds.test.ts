import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: {
    getProjectId: () => 'p1',
    appendProjectRoutePrefix: (path: string) => `/projects/p1${path}`,
  },
}));

import {
  ResourceRef,
  resourceRegistry,
} from '@/features/chat/lib/resources/registry';

const agent: ResourceRef = { kind: 'agent', id: 'a1', name: 'Triage' };
const run: ResourceRef = { kind: 'run', id: 'r1', name: 'Weekly report' };
const connection: ResourceRef = {
  kind: 'connection',
  id: 'c1',
  name: 'Work Gmail',
};

describe('resourceRegistry for agents, runs and connections', () => {
  it('reads each kind from the tool result meta', () => {
    for (const ref of [agent, run, connection]) {
      const output = {
        content: [{ type: 'text', text: 'done' }],
        _meta: {
          apResource: {
            v: 1,
            kind: ref.kind,
            id: ref.id,
            projectId: 'p1',
            op: 'update',
            label: ref.name,
          },
        },
      };
      expect(resourceRegistry.resolve(output)).toEqual({
        ref: { ...ref, projectId: 'p1' },
        op: 'update',
      });
    }
  });

  it('opens each kind on its own page and leaves to its list', () => {
    expect(resourceRegistry.route(agent)).toBe('/projects/p1/agents/a1');
    expect(resourceRegistry.route(run)).toBe('/projects/p1/runs/r1');
    expect(resourceRegistry.route(connection)).toBe('/projects/p1/connections');
    expect(resourceRegistry.parentRoute(agent)).toBe(
      '/projects/p1/automations'
    );
    expect(resourceRegistry.parentRoute(run)).toBe('/projects/p1/runs');
    expect(resourceRegistry.parentRoute(connection)).toBe(
      '/projects/p1/connections'
    );
  });

  it('knows when the page already shows it', () => {
    expect(resourceRegistry.isOn('/projects/p1/agents/a1', agent)).toBe(true);
    expect(resourceRegistry.isOn('/projects/p1/runs/r1', run)).toBe(true);
    expect(resourceRegistry.isOn('/projects/p1/runs', run)).toBe(false);
    expect(resourceRegistry.isOn('/projects/p1/connections', connection)).toBe(
      true
    );
  });

  it('refreshes the run and its lists after a change', () => {
    expect(resourceRegistry.queryKeys(run)).toEqual([
      ['run', 'r1'],
      ['flow-run', 'r1'],
      ['flow-run-table'],
      ['flow-run-count-by-status'],
    ]);
  });
});
