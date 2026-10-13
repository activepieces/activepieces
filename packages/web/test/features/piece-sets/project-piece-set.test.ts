import {
  PieceSelectionMode,
  PieceSet,
  RequiredActionsMode,
} from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { projectPieceSet } from '@/features/piece-sets/utils/project-piece-set';

const set = ({
  id,
  name,
  isDefault = false,
}: {
  id: string;
  name: string;
  isDefault?: boolean;
}): PieceSet => ({
  id,
  created: '2026-01-01T00:00:00.000Z',
  updated: '2026-01-01T00:00:00.000Z',
  platformId: 'pl_1',
  name,
  key: name.toLowerCase(),
  isDefault,
  generatedForProjectId: null,
  config: {
    pieces: { mode: PieceSelectionMode.INCLUDE_ALL, exceptions: [] },
    selectedActions: {},
    selectedTriggers: {},
    requiredActions: { mode: RequiredActionsMode.ANY, actions: {} },
  },
});

const fallback = set({ id: 'ps_default', name: 'Everyone', isDefault: true });
const finance = set({ id: 'ps_finance', name: 'Finance' });
const setNames = new Map([
  [fallback.id, fallback.name],
  [finance.id, finance.name],
]);
const row = (pieceSet: PieceSet, pieceSetId: string | null) =>
  projectPieceSet.assignRow({
    pieceSet,
    project: { pieceSetId },
    defaultSetId: fallback.id,
    setNames,
  });

describe('projectPieceSet.assignRow', () => {
  it('locks a project already in the default set and names the set as renamed', () => {
    expect(row(fallback, null)).toEqual({
      locked: true,
      lockedIn: 'Everyone',
      currentlyIn: null,
    });
    expect(row(fallback, fallback.id).lockedIn).toBe('Everyone');
  });

  it('shows where a project in another set currently is, without locking it', () => {
    expect(row(fallback, finance.id)).toEqual({
      locked: false,
      lockedIn: null,
      currentlyIn: 'Finance',
    });
    expect(row(finance, null).currentlyIn).toBe('Everyone');
  });

  it('leaves a project already in a non-default set unlocked and unlabelled', () => {
    expect(row(finance, finance.id)).toEqual({
      locked: false,
      lockedIn: null,
      currentlyIn: null,
    });
  });
});
