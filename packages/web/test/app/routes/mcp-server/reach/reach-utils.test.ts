import type {
  ActionBase,
  PieceMetadataModelSummary,
} from '@activepieces/pieces-framework';
import { describe, expect, it } from 'vitest';

import { reachUtils } from '@/app/routes/mcp-server/reach/reach-utils';

function action(
  displayName: string,
  classification?: ActionBase['classification']
): ActionBase {
  return {
    name: displayName.toLowerCase().replace(/\s/g, '_'),
    displayName,
    description: `${displayName} description`,
    props: {},
    requireAuth: true,
    classification,
  };
}

function piece(
  overrides: Partial<PieceMetadataModelSummary> &
    Pick<PieceMetadataModelSummary, 'name' | 'displayName'>
): PieceMetadataModelSummary {
  return {
    description: '',
    actions: 0,
    triggers: 0,
    suggestedActions: [],
    ...overrides,
  } as PieceMetadataModelSummary;
}

const slack = piece({
  name: '@activepieces/piece-slack',
  displayName: 'Slack',
  description: 'Send messages, read channels',
  suggestedActions: [
    action('Get User', 'READ'),
    action('List Users', 'SEARCH'),
    action('Send Message', 'WRITE'),
    action('Archive Channel', 'DESTRUCTIVE'),
  ],
});

const gmail = piece({
  name: '@activepieces/piece-gmail',
  displayName: 'Gmail',
  description: 'Read the inbox',
  suggestedActions: [action('Send Email', 'WRITE')],
});

describe('reachUtils.toReachablePieces', () => {
  it('returns every piece collapsed when there is no query', () => {
    const rows = reachUtils.toReachablePieces({
      pieces: [slack, gmail],
      isSearching: false,
    });

    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.forceExpanded)).toBe(false);
    expect(rows[0].actionCount).toBe(4);
  });

  it('counts destructive actions per piece', () => {
    const [slackRow, gmailRow] = reachUtils.toReachablePieces({
      pieces: [slack, gmail],
      isSearching: false,
    });

    expect(slackRow.destructiveActionCount).toBe(1);
    expect(gmailRow.destructiveActionCount).toBe(0);
  });

  it('groups actions in READ, SEARCH, WRITE, DESTRUCTIVE order and omits empty groups', () => {
    const [slackRow, gmailRow] = reachUtils.toReachablePieces({
      pieces: [slack, gmail],
      isSearching: false,
    });

    expect(slackRow.groups.map((group) => group.classification)).toEqual([
      'READ',
      'SEARCH',
      'WRITE',
      'DESTRUCTIVE',
    ]);
    expect(gmailRow.groups.map((group) => group.classification)).toEqual([
      'WRITE',
    ]);
  });

  it('treats an unclassified action as WRITE, never as read-only', () => {
    const unknown = piece({
      name: '@activepieces/piece-unknown',
      displayName: 'Unknown',
      suggestedActions: [action('Do Something', undefined)],
    });

    const [row] = reachUtils.toReachablePieces({
      pieces: [unknown],
      isSearching: false,
    });

    expect(row.groups).toEqual([
      expect.objectContaining({ classification: 'WRITE' }),
    ]);
    expect(row.destructiveActionCount).toBe(0);
  });

  it('keeps the server relevance order and expands every row while searching', () => {
    const rows = reachUtils.toReachablePieces({
      pieces: [gmail, slack],
      isSearching: true,
    });

    expect(rows.map((row) => row.piece.displayName)).toEqual([
      'Gmail',
      'Slack',
    ]);
    expect(rows.every((row) => row.forceExpanded)).toBe(true);
  });

  it('orders popular pieces first only when not searching', () => {
    const rows = reachUtils.toReachablePieces({
      pieces: [gmail, slack],
      isSearching: false,
    });

    expect(rows.map((row) => row.piece.displayName)).toEqual([
      'Slack',
      'Gmail',
    ]);
  });

  it('reports what the server returned for a piece, not its whole catalogue', () => {
    const narrowedSlack = piece({
      name: '@activepieces/piece-slack',
      displayName: 'Slack',
      suggestedActions: [action('Archive Channel', 'DESTRUCTIVE')],
    });

    const [row] = reachUtils.toReachablePieces({
      pieces: [narrowedSlack],
      isSearching: true,
    });

    expect(row.actionCount).toBe(1);
    expect(row.destructiveActionCount).toBe(1);
    expect(row.groups).toEqual([
      expect.objectContaining({ classification: 'DESTRUCTIVE' }),
    ]);
  });

  it('drops pieces that expose no actions at all', () => {
    const actionless = piece({
      name: '@activepieces/piece-actionless',
      displayName: 'Actionless',
      suggestedActions: [],
    });

    expect(
      reachUtils.toReachablePieces({ pieces: [actionless], isSearching: false })
    ).toEqual([]);
  });
});
