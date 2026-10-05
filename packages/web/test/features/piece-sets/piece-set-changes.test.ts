import {
  PieceSelectionMode,
  PieceSet,
  RequiredActionsMode,
} from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import {
  PieceSetChange,
  pieceSetChanges,
} from '@/features/piece-sets/utils/piece-set-changes';

const pieceSet = (config: Partial<PieceSet['config']> = {}): PieceSet => ({
  id: 'ps_1',
  created: '2026-01-01T00:00:00.000Z',
  updated: '2026-01-01T00:00:00.000Z',
  platformId: 'pl_1',
  name: 'Finance',
  key: 'finance',
  isDefault: false,
  generatedForProjectId: null,
  config: {
    pieces: { mode: PieceSelectionMode.INCLUDE_ALL, exceptions: [] },
    selectedActions: {},
    selectedTriggers: {},
    requiredActions: [],
    requiredActionsMode: RequiredActionsMode.ANY,
    ...config,
  },
});

describe('pieceSetChanges.apply', () => {
  it('blocks a piece on an allow-all policy by listing it as an exception', () => {
    const next = pieceSetChanges.apply({
      pieceSet: pieceSet(),
      change: { type: 'visibility', visible: { slack: false } },
    });
    expect(next.config.pieces).toEqual({
      mode: PieceSelectionMode.INCLUDE_ALL,
      exceptions: ['slack'],
    });
  });

  it('is idempotent, so replaying a change on fresher data is safe', () => {
    const change = {
      type: 'visibility' as const,
      visible: { slack: false, gmail: false },
    };
    const once = pieceSetChanges.apply({ pieceSet: pieceSet(), change });
    const twice = pieceSetChanges.apply({ pieceSet: once, change });
    expect(twice.config.pieces).toEqual(once.config.pieces);
  });

  it('keeps the selection when the new-pieces mode already matches', () => {
    const current = pieceSet({
      pieces: { mode: PieceSelectionMode.INCLUDE_ALL, exceptions: ['slack'] },
    });
    const next = pieceSetChanges.apply({
      pieceSet: current,
      change: {
        type: 'newPieces',
        include: true,
        knownPieceNames: ['slack', 'gmail'],
      },
    });
    expect(next.config.pieces).toBe(current.config.pieces);
  });

  it('flips to block-new-pieces while keeping the same pieces allowed', () => {
    const next = pieceSetChanges.apply({
      pieceSet: pieceSet({
        pieces: {
          mode: PieceSelectionMode.INCLUDE_ALL,
          exceptions: ['slack'],
        },
      }),
      change: {
        type: 'newPieces',
        include: false,
        knownPieceNames: ['slack', 'gmail', 'notion'],
      },
    });
    expect(next.config.pieces).toEqual({
      mode: PieceSelectionMode.EXCLUDE_ALL,
      exceptions: ['gmail', 'notion'],
    });
  });

  it('drops a curated piece back to all actions', () => {
    const next = pieceSetChanges.apply({
      pieceSet: pieceSet({
        selectedActions: { slack: ['send_message'] },
        selectedTriggers: { slack: [] },
      }),
      change: {
        type: 'components',
        pieceName: 'slack',
        pieceDisplayName: 'Slack',
        actions: { mode: 'all' },
        triggers: { mode: 'all' },
      },
    });
    expect(next.config.selectedActions).toEqual({});
    expect(next.config.selectedTriggers).toEqual({});
  });
});

describe('pieceSetChanges.inverse', () => {
  it('restores each piece to the visibility it had before', () => {
    const previous = pieceSet({
      pieces: { mode: PieceSelectionMode.INCLUDE_ALL, exceptions: ['gmail'] },
    });
    const change = {
      type: 'visibility' as const,
      visible: { slack: false, gmail: false },
    };
    const changed = pieceSetChanges.apply({ pieceSet: previous, change });
    const undone = pieceSetChanges.apply({
      pieceSet: changed,
      change: pieceSetChanges.inverse({ previous, change }),
    });
    expect(pieceSetChanges.sameConfig(undone.config, previous.config)).toBe(
      true,
    );
  });

  it('restores the curated actions of a piece', () => {
    const previous = pieceSet({
      selectedActions: { slack: ['send_message'] },
    });
    const inverse = pieceSetChanges.inverse({
      previous,
      change: {
        type: 'components',
        pieceName: 'slack',
        pieceDisplayName: 'Slack',
        actions: { mode: 'all' },
        triggers: { mode: 'all' },
      },
    });
    expect(inverse).toMatchObject({
      actions: { mode: 'selected', selected: ['send_message'] },
      triggers: { mode: 'all' },
    });
  });

  it('restores the previous publishing rule', () => {
    const previous = pieceSet({ requiredActionsMode: RequiredActionsMode.ALL });
    expect(
      pieceSetChanges.inverse({
        previous,
        change: { type: 'requiredMode', mode: RequiredActionsMode.ANY },
      }),
    ).toEqual({ type: 'requiredMode', mode: RequiredActionsMode.ALL });
  });

  it('restores exceptions for pieces that left the catalog when undoing new-pieces mode', () => {
    const previous = pieceSet({
      pieces: {
        mode: PieceSelectionMode.INCLUDE_ALL,
        exceptions: ['slack', 'retired-piece'],
      },
    });
    const change: PieceSetChange = {
      type: 'newPieces',
      include: false,
      knownPieceNames: ['slack', 'gmail'],
    };
    const flipped = pieceSetChanges.apply({ pieceSet: previous, change });
    const undone = pieceSetChanges.apply({
      pieceSet: flipped,
      change: pieceSetChanges.inverse({ previous, change }),
    });
    expect(undone.config.pieces).toEqual(previous.config.pieces);
  });
});

describe('pieceSetChanges.toRequest', () => {
  it('sends the full piece selection built from the latest data', () => {
    const latest = pieceSet({
      pieces: { mode: PieceSelectionMode.INCLUDE_ALL, exceptions: ['gmail'] },
    });
    expect(
      pieceSetChanges.toRequest({
        pieceSet: latest,
        change: { type: 'visibility', visible: { slack: false } },
      }),
    ).toEqual({
      pieces: {
        mode: PieceSelectionMode.INCLUDE_ALL,
        exceptions: ['gmail', 'slack'],
      },
    });
  });

  it('sends only the intent of the piece that changed', () => {
    expect(
      pieceSetChanges.toRequest({
        pieceSet: pieceSet(),
        change: {
          type: 'components',
          pieceName: 'slack',
          pieceDisplayName: 'Slack',
          actions: { mode: 'selected', selected: ['send_message'] },
          triggers: { mode: 'all' },
        },
      }),
    ).toEqual({
      actions: { slack: { mode: 'selected', selected: ['send_message'] } },
      triggers: { slack: { mode: 'all' } },
    });
  });
});

describe('pieceSetChanges.sameConfig', () => {
  it('ignores the order of exceptions and selections', () => {
    expect(
      pieceSetChanges.sameConfig(
        pieceSet({
          pieces: {
            mode: PieceSelectionMode.EXCLUDE_ALL,
            exceptions: ['a', 'b'],
          },
        }).config,
        pieceSet({
          pieces: {
            mode: PieceSelectionMode.EXCLUDE_ALL,
            exceptions: ['b', 'a'],
          },
        }).config,
      ),
    ).toBe(true);
  });

  it('notices a changed mode', () => {
    expect(
      pieceSetChanges.sameConfig(
        pieceSet().config,
        pieceSet({ requiredActionsMode: RequiredActionsMode.ALL }).config,
      ),
    ).toBe(false);
  });
});
