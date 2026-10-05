import { describe, expect, it } from 'vitest';

import { reachableProjectUtils } from '@/app/routes/mcp-server/tools/project-selection';

const SESSION_PROJECT = 'session-project';
const REACHABLE = 'reachable-project';

describe('reachableProjectUtils.resolveSelected', () => {
  it('keeps the session project when MCP reaches it', () => {
    const selected = reachableProjectUtils.resolveSelected({
      projectId: SESSION_PROJECT,
      reachableProjectIds: [SESSION_PROJECT, REACHABLE],
    });

    expect(selected).toBe(SESSION_PROJECT);
  });

  it('falls to a reachable project rather than opening on a denial', () => {
    const selected = reachableProjectUtils.resolveSelected({
      projectId: SESSION_PROJECT,
      reachableProjectIds: [REACHABLE],
    });

    expect(selected).toBe(REACHABLE);
  });

  it('picks a project when the URL names none', () => {
    const selected = reachableProjectUtils.resolveSelected({
      projectId: null,
      reachableProjectIds: [REACHABLE],
    });

    expect(selected).toBe(REACHABLE);
  });

  it('leaves the session project alone while reach is unknown, so the page still loads', () => {
    const selected = reachableProjectUtils.resolveSelected({
      projectId: SESSION_PROJECT,
      reachableProjectIds: null,
    });

    expect(selected).toBe(SESSION_PROJECT);
  });

  it('leaves the session project alone when reach is empty, and lets the server refuse', () => {
    const selected = reachableProjectUtils.resolveSelected({
      projectId: SESSION_PROJECT,
      reachableProjectIds: [],
    });

    expect(selected).toBe(SESSION_PROJECT);
  });
});
