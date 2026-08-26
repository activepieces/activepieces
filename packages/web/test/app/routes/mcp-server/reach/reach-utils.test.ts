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
      searchQuery: '',
    });

    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.forceExpanded)).toBe(false);
    expect(rows[0].actionCount).toBe(4);
  });

  it('counts destructive actions per piece', () => {
    const [slackRow, gmailRow] = reachUtils.toReachablePieces({
      pieces: [slack, gmail],
      searchQuery: '',
    });

    expect(slackRow.destructiveActionCount).toBe(1);
    expect(gmailRow.destructiveActionCount).toBe(0);
  });

  it('groups actions in READ, SEARCH, WRITE, DESTRUCTIVE order and omits empty groups', () => {
    const [slackRow, gmailRow] = reachUtils.toReachablePieces({
      pieces: [slack, gmail],
      searchQuery: '',
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
      searchQuery: '',
    });

    expect(row.groups).toEqual([
      expect.objectContaining({ classification: 'WRITE' }),
    ]);
    expect(row.destructiveActionCount).toBe(0);
  });

  it('keeps a piece collapsed with all its actions when the piece name matches', () => {
    const rows = reachUtils.toReachablePieces({
      pieces: [slack, gmail],
      searchQuery: 'slack',
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].piece.displayName).toBe('Slack');
    expect(rows[0].forceExpanded).toBe(false);
    expect(rows[0].actionCount).toBe(4);
  });

  it('auto-expands and narrows to matching actions on an action-level match', () => {
    const rows = reachUtils.toReachablePieces({
      pieces: [slack, gmail],
      searchQuery: 'archive channel',
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].piece.displayName).toBe('Slack');
    expect(rows[0].forceExpanded).toBe(true);
    expect(rows[0].actionCount).toBe(1);
    expect(rows[0].groups).toEqual([
      expect.objectContaining({ classification: 'DESTRUCTIVE' }),
    ]);
  });

  it('drops pieces that match neither by name nor by any action', () => {
    expect(
      reachUtils.toReachablePieces({
        pieces: [slack, gmail],
        searchQuery: 'zzzz',
      })
    ).toEqual([]);
  });

  it('drops pieces that expose no actions at all', () => {
    const actionless = piece({
      name: '@activepieces/piece-actionless',
      displayName: 'Actionless',
      suggestedActions: [],
    });

    expect(
      reachUtils.toReachablePieces({ pieces: [actionless], searchQuery: '' })
    ).toEqual([]);
  });
});
