import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

import { agentToolAccount } from '@/features/agents/agent-tools/lib/agent-tool-account';

const tool = (auth?: string, actionName = 'send') =>
  ({
    type: 'PIECE',
    toolName: `gmail-${actionName}`,
    pieceMetadata: {
      pieceName: '@activepieces/piece-gmail',
      pieceVersion: '1.0.0',
      actionName,
      ...(auth === undefined ? {} : { predefinedInput: { auth, fields: {} } }),
    },
  } as never);

const connections = [{ externalId: 'conn_1', displayName: 'Work mail' }];
const loaded = { connections, connectionsComplete: true };

describe('agentToolAccount.requiresAccount', () => {
  it('needs one when the piece has auth and the action does not opt out', () => {
    expect(
      agentToolAccount.requiresAccount({
        pieceHasAuth: true,
        actionRequireAuth: true,
      }),
    ).toBe(true);
  });

  it('needs none when the piece has no auth at all', () => {
    expect(
      agentToolAccount.requiresAccount({
        pieceHasAuth: false,
        actionRequireAuth: true,
      }),
    ).toBe(false);
  });

  it('needs none for an action that opts out, so a formatter is not asked for an account', () => {
    expect(
      agentToolAccount.requiresAccount({
        pieceHasAuth: true,
        actionRequireAuth: false,
      }),
    ).toBe(false);
  });

  it('assumes an unknown action needs one, matching the framework default', () => {
    expect(
      agentToolAccount.requiresAccount({
        pieceHasAuth: true,
        actionRequireAuth: undefined,
      }),
    ).toBe(true);
  });
});

describe('agentToolAccount.label', () => {
  it('says nothing when no tool needs an account', () => {
    expect(agentToolAccount.label({ tools: [], ...loaded })).toBeNull();
  });

  it('asks for a connection when a tool has none, worded as the action to take', () => {
    expect(agentToolAccount.label({ tools: [tool()], ...loaded })).toBe(
      'Connect an account',
    );
  });

  it('names the pinned account so the row says which one is used', () => {
    expect(agentToolAccount.label({ tools: [tool('conn_1')], ...loaded })).toBe(
      'Work mail',
    );
  });

  it('reads the older template pin, so a legacy agent does not look broken', () => {
    expect(
      agentToolAccount.label({
        tools: [tool("{{connections['conn_1']}}")],
        ...loaded,
      }),
    ).toBe('Work mail');
  });

  it('stays silent while the connections are still loading, instead of crying deleted', () => {
    expect(
      agentToolAccount.label({
        tools: [tool('conn_1')],
        connections: [],
        connectionsComplete: false,
      }),
    ).toBeNull();
  });

  it('stays silent when the list was truncated, since absence proves nothing there', () => {
    expect(
      agentToolAccount.label({
        tools: [tool('conn_outside_page')],
        connections,
        connectionsComplete: false,
      }),
    ).toBeNull();
  });

  it('still names an account found inside a truncated list', () => {
    expect(
      agentToolAccount.label({
        tools: [tool('conn_1')],
        connections,
        connectionsComplete: false,
      }),
    ).toBe('Work mail');
  });

  it('says the account was deleted once we know it is really gone', () => {
    expect(
      agentToolAccount.label({ tools: [tool('conn_deleted')], ...loaded }),
    ).toBe('Account was deleted');
  });

  it('asks for a connection when one action of the app still lacks it', () => {
    expect(
      agentToolAccount.label({
        tools: [tool('conn_1'), tool()],
        ...loaded,
      }),
    ).toBe('Connect an account');
  });

  it('names the consequence when actions disagree, not merely that several exist', () => {
    expect(
      agentToolAccount.label({
        tools: [tool('conn_1'), tool('conn_2', 'read')],
        connections: [
          ...connections,
          { externalId: 'conn_2', displayName: 'Personal mail' },
        ],
        connectionsComplete: true,
      }),
    ).toBe('Different account per action');
  });

  it('distinguishes two different dangling pins, which a name-based dedupe merged', () => {
    expect(
      agentToolAccount.label({
        tools: [tool('gone_a'), tool('gone_b', 'read')],
        ...loaded,
      }),
    ).toBe('Different account per action');
  });

  it('treats two connections that share a display name as two accounts', () => {
    expect(
      agentToolAccount.label({
        tools: [tool('conn_1'), tool('conn_2', 'read')],
        connections: [
          { externalId: 'conn_1', displayName: 'Mail' },
          { externalId: 'conn_2', displayName: 'Mail' },
        ],
        connectionsComplete: true,
      }),
    ).toBe('Different account per action');
  });
});

describe('agentToolAccount.listIsComplete', () => {
  const full = { isSuccess: true, isFetching: false, count: 5, pageSize: 1000 };

  it('is complete for a settled partial page, which is the normal case', () => {
    expect(agentToolAccount.listIsComplete(full)).toBe(true);
  });

  it('is not complete while a refetch is in flight, even though cached data already succeeded', () => {
    expect(agentToolAccount.listIsComplete({ ...full, isFetching: true })).toBe(
      false,
    );
  });

  it('is not complete before the first success', () => {
    expect(agentToolAccount.listIsComplete({ ...full, isSuccess: false })).toBe(
      false,
    );
  });

  it('is not complete when the page came back full, since more may exist unseen', () => {
    expect(agentToolAccount.listIsComplete({ ...full, count: 1000 })).toBe(
      false,
    );
  });

  it('is complete for an empty settled list, so a project with no connections is knowable', () => {
    expect(agentToolAccount.listIsComplete({ ...full, count: 0 })).toBe(true);
  });
});

describe('agentToolAccount.resolve', () => {
  it('carries the state beside the text, so a row can colour its dot', () => {
    expect(agentToolAccount.resolve({ tools: [], ...loaded })).toBeNull();
    expect(
      agentToolAccount.resolve({ tools: [tool()], ...loaded })?.state,
    ).toBe('missing');
    expect(
      agentToolAccount.resolve({ tools: [tool('conn_1')], ...loaded }),
    ).toStrictEqual({ state: 'connected', text: 'Work mail' });
    expect(
      agentToolAccount.resolve({
        tools: [tool('conn_deleted')],
        ...loaded,
      })?.state,
    ).toBe('deleted');
  });

  it('says the same thing as label, so the two cannot drift', () => {
    const params = { tools: [tool('conn_1')], ...loaded };

    expect(agentToolAccount.resolve(params)?.text).toBe(
      agentToolAccount.label(params),
    );
  });
});
