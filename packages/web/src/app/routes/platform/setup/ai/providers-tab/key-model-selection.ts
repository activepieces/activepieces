import { AiProviderModelScope } from '@activepieces/shared';

function isOn({
  selection,
  modelId,
  lockedIds,
}: {
  selection: KeyModelSelection;
  modelId: string;
  lockedIds: string[];
}): boolean {
  return (
    selection.modelScope === 'all' ||
    selection.modelIds.includes(modelId) ||
    lockedIds.includes(modelId)
  );
}

function setAutoAdd({
  on,
  listedIds,
  lockedIds,
}: {
  on: boolean;
  listedIds: string[];
  lockedIds: string[];
}): KeyModelSelection {
  return on
    ? { modelScope: 'all', modelIds: [] }
    : { modelScope: 'selected', modelIds: uniqueIds([listedIds, lockedIds]) };
}

function select({
  selection,
  ids,
  lockedIds,
}: {
  selection: KeyModelSelection;
  ids: string[];
  lockedIds: string[];
}): KeyModelSelection {
  if (selection.modelScope === 'all') {
    return selection;
  }
  return {
    modelScope: 'selected',
    modelIds: uniqueIds([selection.modelIds, ids, lockedIds]),
  };
}

function clear({
  selection,
  ids,
  listedIds,
  lockedIds,
}: {
  selection: KeyModelSelection;
  ids: string[];
  listedIds: string[];
  lockedIds: string[];
}): KeyModelSelection {
  const current =
    selection.modelScope === 'all' ? listedIds : selection.modelIds;
  return {
    modelScope: 'selected',
    modelIds: uniqueIds([
      current.filter((modelId) => !ids.includes(modelId)),
      lockedIds,
    ]),
  };
}

function toggle({
  selection,
  modelId,
  listedIds,
  lockedIds,
}: {
  selection: KeyModelSelection;
  modelId: string;
  listedIds: string[];
  lockedIds: string[];
}): KeyModelSelection {
  if (lockedIds.includes(modelId)) {
    return selection;
  }
  return isOn({ selection, modelId, lockedIds })
    ? clear({ selection, ids: [modelId], listedIds, lockedIds })
    : select({ selection, ids: [modelId], lockedIds });
}

function uniqueIds(lists: string[][]): string[] {
  return [...new Set(lists.flat())];
}

export const keyModelSelection = { isOn, setAutoAdd, select, clear, toggle };

export type KeyModelSelection = {
  modelScope: AiProviderModelScope;
  modelIds: string[];
};
