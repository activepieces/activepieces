import { describe, expect, it } from 'vitest';

import {
  KeyModelSelection,
  keyModelSelection,
} from '@/app/routes/platform/setup/ai/providers-tab/key-model-selection';

const LISTED = ['a', 'b', 'c', 'd'];
const LOCKED = ['a'];
const ALL: KeyModelSelection = { modelScope: 'all', modelIds: [] };
const SOME: KeyModelSelection = {
  modelScope: 'selected',
  modelIds: ['a', 'b'],
};

describe('keyModelSelection', () => {
  it('leaves all mode with every other model ticked when one is unticked', () => {
    expect(
      keyModelSelection.toggle({
        selection: ALL,
        modelId: 'c',
        listedIds: LISTED,
        lockedIds: LOCKED,
      }),
    ).toEqual({ modelScope: 'selected', modelIds: ['a', 'b', 'd'] });
  });

  it('toggles a model in selected mode', () => {
    const args = { listedIds: LISTED, lockedIds: LOCKED };
    expect(
      keyModelSelection.toggle({ ...args, selection: SOME, modelId: 'c' }),
    ).toEqual({ modelScope: 'selected', modelIds: ['a', 'b', 'c'] });
    expect(
      keyModelSelection.toggle({ ...args, selection: SOME, modelId: 'b' }),
    ).toEqual({ modelScope: 'selected', modelIds: ['a'] });
  });

  it('never removes a tier-locked model', () => {
    const args = { listedIds: LISTED, lockedIds: LOCKED };
    expect(
      keyModelSelection.toggle({ ...args, selection: ALL, modelId: 'a' }),
    ).toBe(ALL);
    expect(
      keyModelSelection.toggle({ ...args, selection: SOME, modelId: 'a' }),
    ).toBe(SOME);
    expect(
      keyModelSelection.clear({ ...args, selection: ALL, ids: LISTED }),
    ).toEqual({ modelScope: 'selected', modelIds: ['a'] });
    expect(
      keyModelSelection.clear({
        ...args,
        selection: { modelScope: 'selected', modelIds: [] },
        ids: LISTED,
      }),
    ).toEqual({ modelScope: 'selected', modelIds: ['a'] });
    expect(
      keyModelSelection.setAutoAdd({
        on: false,
        listedIds: ['b'],
        lockedIds: LOCKED,
      }),
    ).toEqual({ modelScope: 'selected', modelIds: ['b', 'a'] });
  });

  it('turns all mode on with the switch and off with every listed model ticked', () => {
    expect(
      keyModelSelection.setAutoAdd({
        on: true,
        listedIds: LISTED,
        lockedIds: LOCKED,
      }),
    ).toEqual(ALL);
    expect(
      keyModelSelection.setAutoAdd({
        on: false,
        listedIds: LISTED,
        lockedIds: LOCKED,
      }),
    ).toEqual({ modelScope: 'selected', modelIds: LISTED });
  });

  it('selects all without turning auto-add back on', () => {
    expect(
      keyModelSelection.select({
        selection: SOME,
        ids: LISTED,
        lockedIds: LOCKED,
      }),
    ).toEqual({ modelScope: 'selected', modelIds: LISTED });
    expect(
      keyModelSelection.select({
        selection: ALL,
        ids: LISTED,
        lockedIds: LOCKED,
      }),
    ).toBe(ALL);
  });

  it('selects and clears only the shown rows', () => {
    const args = { listedIds: LISTED, lockedIds: LOCKED };
    expect(
      keyModelSelection.select({
        selection: SOME,
        ids: ['d'],
        lockedIds: LOCKED,
      }),
    ).toEqual({ modelScope: 'selected', modelIds: ['a', 'b', 'd'] });
    expect(
      keyModelSelection.clear({ ...args, selection: ALL, ids: ['a', 'b'] }),
    ).toEqual({ modelScope: 'selected', modelIds: ['c', 'd', 'a'] });
    expect(
      keyModelSelection.clear({ ...args, selection: SOME, ids: ['b', 'c'] }),
    ).toEqual({ modelScope: 'selected', modelIds: ['a'] });
  });

  it('reads every model as on in all mode and locked models as on always', () => {
    expect(
      keyModelSelection.isOn({ selection: ALL, modelId: 'z', lockedIds: [] }),
    ).toBe(true);
    expect(
      keyModelSelection.isOn({
        selection: { modelScope: 'selected', modelIds: [] },
        modelId: 'a',
        lockedIds: LOCKED,
      }),
    ).toBe(true);
    expect(
      keyModelSelection.isOn({
        selection: SOME,
        modelId: 'c',
        lockedIds: LOCKED,
      }),
    ).toBe(false);
  });
});
