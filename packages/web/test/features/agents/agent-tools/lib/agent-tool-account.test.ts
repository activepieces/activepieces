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
  }) as never;

const connections = [{ externalId: 'conn_1', displayName: 'Work mail' }];
const loaded = { connections, connectionsLoaded: true };

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
        connectionsLoaded: false,
      }),
    ).toBeNull();
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
        connectionsLoaded: true,
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
        connectionsLoaded: true,
      }),
    ).toBe('Different account per action');
  });
});
