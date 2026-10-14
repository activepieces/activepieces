import { McpOAuthGrant } from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

import { CatalogClient } from '@/app/routes/mcp-server/mcp-client-catalog';

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getCurrentUserId: () => 'user-1' },
}));
vi.mock('@/app/routes/mcp-server/mcp-grants-hooks', () => ({
  mcpGrantsQueries: { useAllGrants: vi.fn() },
}));

const { connectWatchUtils } = await import(
  '@/app/routes/mcp-server/connect/use-connect-home'
);

const NOW = 1_000_000;

function client(
  key: string,
  grantKey: CatalogClient['grantKey'],
): CatalogClient {
  return {
    key,
    grantKey,
    icon: '',
    name: key,
    kind: 'editor',
    docsUrl: '',
    methods: [],
  };
}

function grant(clientKey: McpOAuthGrant['clientKey']): McpOAuthGrant {
  return {
    id: `grant-${clientKey}`,
    clientKey,
    clientName: null,
    projectId: null,
    projectName: null,
    member: null,
    created: '2026-10-01T00:00:00.000Z',
    lastUsedAt: null,
  };
}

const CURSOR = client('cursor', 'cursor');
const CLINE = client('cline', null);
const CLIENTS = [CURSOR, CLINE, client('unknown', 'unknown')];

describe('connectWatchUtils.isWatching', () => {
  it('watches while a setup is waiting, even when no tile was clicked', () => {
    expect(
      connectWatchUtils.isWatching({
        until: null,
        isWaitingOnSetup: true,
        now: NOW,
      }),
    ).toBe(true);
  });

  it('keeps watching after a tile click until the window ends', () => {
    expect(
      connectWatchUtils.isWatching({
        until: NOW + 1,
        isWaitingOnSetup: false,
        now: NOW,
      }),
    ).toBe(true);
    expect(
      connectWatchUtils.isWatching({
        until: NOW - 1,
        isWaitingOnSetup: false,
        now: NOW,
      }),
    ).toBe(false);
  });

  it('does not watch on the stage when nothing started it', () => {
    expect(
      connectWatchUtils.isWatching({
        until: null,
        isWaitingOnSetup: false,
        now: NOW,
      }),
    ).toBe(false);
  });
});

describe('connectWatchUtils.isWaitingOnSetup', () => {
  it('waits for a detectable client that has not connected yet', () => {
    expect(
      connectWatchUtils.isWaitingOnSetup({
        client: CURSOR,
        grants: [],
        clients: CLIENTS,
      }),
    ).toBe(true);
  });

  it('stops once the open client has connected', () => {
    expect(
      connectWatchUtils.isWaitingOnSetup({
        client: CURSOR,
        grants: [grant('cursor')],
        clients: CLIENTS,
      }),
    ).toBe(false);
  });

  it('never waits for a client the server cannot detect', () => {
    expect(
      connectWatchUtils.isWaitingOnSetup({
        client: CLINE,
        grants: [grant('unknown')],
        clients: CLIENTS,
      }),
    ).toBe(false);
  });

  it('does not wait when no setup is open', () => {
    expect(
      connectWatchUtils.isWaitingOnSetup({
        client: null,
        grants: [],
        clients: CLIENTS,
      }),
    ).toBe(false);
  });
});
