import { describe, expect, it, vi } from 'vitest';

import {
  ResourceRef,
  resourceRegistry,
} from '@/features/chat/lib/resources/registry';

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'p1' },
}));

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
    ]);
  });

  it('only refreshes flow lists when the chat edits a flow', () => {
    expect(resourceRegistry.queryKeys({ ref: flow, op: 'update' })).toEqual([
      ['flows'],
      ['root-flows'],
      ['all-folder-contents'],
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
