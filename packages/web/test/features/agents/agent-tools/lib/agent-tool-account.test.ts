import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

import { agentToolAccount } from '@/features/agents/agent-tools/lib/agent-tool-account';

const tool = (auth?: string) =>
  ({
    type: 'PIECE',
    toolName: 'gmail-send',
    pieceMetadata: {
      pieceName: '@activepieces/piece-gmail',
      pieceVersion: '1.0.0',
      actionName: 'send',
      ...(auth === undefined ? {} : { predefinedInput: { auth, fields: {} } }),
    },
  }) as never;

const connections = [{ externalId: 'conn_1', displayName: 'Work mail' }];

describe('agentToolAccount.label', () => {
  it('says nothing for an app that needs no account', () => {
    expect(
      agentToolAccount.label({
        tools: [tool()],
        connections,
        needsAccount: false,
      }),
    ).toBeNull();
  });

  it('flags a tool with no account, which is the state that caused the asking loop', () => {
    expect(
      agentToolAccount.label({
        tools: [tool()],
        connections,
        needsAccount: true,
      }),
    ).toBe('No account');
  });

  it('names the pinned account so the row says which one is used', () => {
    expect(
      agentToolAccount.label({
        tools: [tool('conn_1')],
        connections,
        needsAccount: true,
      }),
    ).toBe('Work mail');
  });

  it('reads the older template pin, so a legacy agent does not look broken', () => {
    expect(
      agentToolAccount.label({
        tools: [tool("{{connections['conn_1']}}")],
        connections,
        needsAccount: true,
      }),
    ).toBe('Work mail');
  });

  it('flags a pin whose connection is gone rather than showing a blank', () => {
    expect(
      agentToolAccount.label({
        tools: [tool('conn_deleted')],
        connections,
        needsAccount: true,
      }),
    ).toBe('Account not found');
  });

  it('flags one missing account even when a sibling action has one', () => {
    expect(
      agentToolAccount.label({
        tools: [tool('conn_1'), tool()],
        connections,
        needsAccount: true,
      }),
    ).toBe('No account');
  });

  it('says several when actions of one app disagree, since they should share an account', () => {
    expect(
      agentToolAccount.label({
        tools: [tool('conn_1'), tool('conn_2')],
        connections: [...connections, { externalId: 'conn_2', displayName: 'Personal mail' }],
        needsAccount: true,
      }),
    ).toBe('Several accounts');
  });
});
