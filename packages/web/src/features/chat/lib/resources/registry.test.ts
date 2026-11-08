import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'current-project' },
}));

import { ResourceRef, resourceRegistry } from './registry';

const text = (value: string, extra: Record<string, unknown> = {}) => ({
  content: [{ type: 'text', text: value }],
  ...extra,
});

describe('resourceRegistry.outcome', () => {
  it.each([
    ['plain success', text('✅ Inserted 1 record(s). IDs: r1'), 'applied'],
    [
      'still invalid',
      text('⚠️ Step "x" (step_2) added but still invalid.'),
      'partial',
    ],
    ['leading cross', text('❌ Flow not found'), 'failed'],
    ['isError', text('boom', { isError: true }), 'failed'],
    ['success false', { success: false, error: 'nope' }, 'failed'],
    [
      'errorSummary',
      text('done', { structuredContent: { errorSummary: 'bad' } }),
      'failed',
    ],
    [
      'agent tool error',
      { error: 'No agent with that id in this project.' },
      'failed',
    ],
    [
      'permission denied',
      text(
        '❌ Permission denied: no role found for this user in the project.',
        {
          isError: true,
        },
      ),
      'forbidden',
    ],
    [
      'delete declined',
      text(
        'The user declined this delete. Do not retry it; ask what they want instead.',
      ),
      'declined',
    ],
    [
      'agent change declined',
      {
        error:
          'The user declined this change to the agent. Do not retry it; ask what they want instead.',
      },
      'declined',
    ],
    [
      'live test declined',
      text('Live test cancelled by the user. The user declined a real run.'),
      'declined',
    ],
    ['card dismissed', { dismissed: true, message: 'x' }, 'declined'],
    [
      'gate timeout',
      text(
        "⏳ The user hasn't responded to the delete approval yet (it timed out)",
      ),
      'timeout',
    ],
    ['card timeout', { timedOut: true, message: 'x' }, 'timeout'],
    [
      'held behind a question',
      text('Not run: you asked the user a question in the same step.'),
      'held',
    ],
    ['card not shown', { notShown: true, message: 'x' }, 'held'],
    ['json string', JSON.stringify(text('❌ Flow not found')), 'failed'],
    [
      'contract wins',
      text('✅ looks fine', {
        _meta: {
          apResource: {
            kind: 'table',
            id: 't1',
            op: 'update',
            outcome: 'declined',
          },
        },
      }),
      'declined',
    ],
  ])('%s', (_label, output, expected) => {
    expect(resourceRegistry.outcome(output)).toBe(expected);
  });

  it('counts only applied and partial as changes', () => {
    expect(resourceRegistry.isChange('applied')).toBe(true);
    expect(resourceRegistry.isChange('partial')).toBe(true);
    expect(resourceRegistry.isChange('declined')).toBe(false);
    expect(resourceRegistry.isChange('failed')).toBe(false);
  });
});

describe('resourceRegistry.resolve', () => {
  it('reads a built flow from structured output, with its project', () => {
    const resolved = resourceRegistry.resolve({
      toolName: 'ap_build_flow',
      input: { flowName: 'Lead routing' },
      output: text('✅ Flow "Lead routing" created (id: f1)', {
        structuredContent: {
          flowId: 'f1',
          flowUrl: 'https://x.test/projects/p9/flows/f1',
        },
      }),
    });
    expect(resolved).toEqual({
      ref: { kind: 'flow', id: 'f1', projectId: 'p9', name: 'Lead routing' },
      op: 'create',
      outcome: 'applied',
      highlights: [],
    });
  });

  it('reads the copy id of a duplicated flow, not the original', () => {
    const resolved = resourceRegistry.resolve({
      toolName: 'ap_duplicate_flow',
      input: { flowId: 'orig' },
      output: text(
        '✅ Flow duplicated successfully.\n  Original: "A" (id: orig)\n  Copy: "Copy of A" (id: copy1)\n',
      ),
    });
    expect(resolved?.ref.id).toBe('copy1');
    expect(resolved?.op).toBe('create');
  });

  it('maps a declined table delete', () => {
    const resolved = resourceRegistry.resolve({
      toolName: 'ap_delete_table',
      input: { tableId: 't1' },
      output: text(
        'The user declined this delete. Do not retry it; ask what they want instead.',
      ),
    });
    expect(resolved).toMatchObject({
      ref: { kind: 'table', id: 't1' },
      op: 'delete',
      outcome: 'declined',
    });
  });

  it('highlights the step a tool added', () => {
    const resolved = resourceRegistry.resolve({
      toolName: 'ap_add_step',
      input: { flowId: 'f1' },
      output: text('✅ Step "Send" (step_2) added.', {
        structuredContent: {
          stepName: 'step_2',
          displayName: 'Send',
          valid: true,
        },
      }),
    });
    expect(resolved?.highlights).toEqual(['flow-step:step_2']);
  });

  it('takes the agent id from the output when the input has none', () => {
    const resolved = resourceRegistry.resolve({
      toolName: 'ap_update_agent',
      input: {},
      output: { agentId: 'a1', url: 'https://x.test/projects/p2/agents/a1' },
    });
    expect(resolved?.ref).toEqual({ kind: 'agent', id: 'a1', projectId: 'p2' });
  });

  it('prefers the backend contract over the tool table', () => {
    const resolved = resourceRegistry.resolve({
      toolName: 'ap_unknown_tool',
      input: {},
      output: {
        _meta: {
          apResource: {
            v: 1,
            kind: 'table',
            id: 't7',
            projectId: 'p3',
            label: 'Leads',
            op: 'update',
            outcome: 'partial',
            changes: [{ key: 'table-row:r1' }],
          },
        },
      },
    });
    expect(resolved).toEqual({
      ref: { kind: 'table', id: 't7', projectId: 'p3', name: 'Leads' },
      op: 'update',
      outcome: 'partial',
      highlights: ['table-row:r1'],
    });
  });

  it('ignores tools that do not write', () => {
    expect(
      resourceRegistry.resolve({
        toolName: 'ap_list_flows',
        input: {},
        output: text('ok'),
      }),
    ).toBeNull();
  });
});

describe('resourceRegistry routes', () => {
  it('builds project-aware routes, falling back to the current project', () => {
    expect(resourceRegistry.route({ kind: 'table', id: 't1' })).toBe(
      '/projects/current-project/tables/t1',
    );
    expect(
      resourceRegistry.route({ kind: 'flow', id: 'f1', projectId: 'p2' }),
    ).toBe('/projects/p2/flows/f1');
    expect(resourceRegistry.parentRoute({ kind: 'table', id: 't1' })).toBe(
      '/projects/current-project/automations',
    );
  });

  it('matches the resource page and its sub-pages only', () => {
    const ref: ResourceRef = { kind: 'agent', id: 'a1' };
    expect(resourceRegistry.isOn('/projects/p/agents/a1', ref)).toBe(true);
    expect(resourceRegistry.isOn('/projects/p/agents/a1/runs', ref)).toBe(true);
    expect(resourceRegistry.isOn('/projects/p/agents/a12', ref)).toBe(false);
    expect(
      resourceRegistry.isOn('/projects/p/agents/a1', {
        ...ref,
        projectId: 'other',
      }),
    ).toBe(false);
  });

  it('refreshes the automations list for flows and tables', () => {
    const keys = resourceRegistry.queryKeys({ kind: 'table', id: 't1' });
    expect(keys).toEqual(
      expect.arrayContaining([
        ['records', 't1'],
        ['root-tables'],
        ['all-folder-contents'],
        ['folders'],
      ]),
    );
    expect(resourceRegistry.queryKeys({ kind: 'flow', id: 'f1' })).toEqual(
      expect.arrayContaining([['flows'], ['root-flows']]),
    );
  });
});

describe('resourceRegistry settings and page refs', () => {
  it('routes settings kinds without forcing a project for the platform', () => {
    expect(
      resourceRegistry.route({ kind: 'platform-settings', id: 'general' }),
    ).toBe('/platform/general');
    expect(
      resourceRegistry.route({ kind: 'platform-settings', id: 'ai_providers' }),
    ).toBe('/platform/ai');
    expect(
      resourceRegistry.route({ kind: 'project-settings', id: 'members' }),
    ).toBe('/projects/current-project/automations?settings=members');
  });

  it('reads the resource on screen from the path', () => {
    expect(resourceRegistry.refAt('/projects/p1/tables/t1')).toEqual({
      kind: 'table',
      id: 't1',
      projectId: 'p1',
    });
    expect(resourceRegistry.refAt('/projects/p1/flows/f1/runs')).toEqual({
      kind: 'flow',
      id: 'f1',
      projectId: 'p1',
    });
    expect(resourceRegistry.refAt('/platform/users')).toEqual({
      kind: 'platform-settings',
      id: 'members',
    });
    expect(resourceRegistry.refAt('/projects/p1/automations')).toBeNull();
    expect(resourceRegistry.refAt('/platform/sso')).toBeNull();
  });

  it('ignores list pages', () => {
    expect(resourceRegistry.refAt('/projects/p1/automations')).toBeNull();
    expect(resourceRegistry.refAt('/projects/p1/connections')).toBeNull();
    expect(resourceRegistry.refAt('/projects/p1/flows')).toBeNull();
    expect(resourceRegistry.refAt('/chat')).toBeNull();
  });

  it('resolves settings tools without auto-opening them', () => {
    const resolved = resourceRegistry.resolve({
      toolName: 'ap_update_settings',
      input: { scope: 'platform', section: 'general', patch: { name: 'Acme' } },
      output: { content: [{ type: 'text', text: '✅ Renamed' }] },
    });
    expect(resolved?.ref).toEqual({ kind: 'platform-settings', id: 'general' });
    expect(resolved?.highlights).toEqual(['platform.general.name']);
    expect(resourceRegistry.autoOpensTool('ap_update_settings')).toBe(false);
    expect(resourceRegistry.autoOpens('table')).toBe(true);
  });
});
