function cap<T>({
  items,
  limit,
  expanded,
}: {
  items: T[];
  limit: number;
  expanded: boolean;
}): CappedList<T> {
  if (expanded || items.length <= limit) {
    return { visible: items, hiddenCount: 0 };
  }
  return { visible: items.slice(0, limit), hiddenCount: items.length - limit };
}

function freezeRows<S>({
  previous,
  filterKey,
  source,
  computeNames,
}: {
  previous: FrozenRows<S> | null;
  filterKey: string;
  source: S;
  computeNames: () => string[];
}): FrozenRows<S> {
  if (
    previous !== null &&
    previous.filterKey === filterKey &&
    previous.source === source
  ) {
    return previous;
  }
  return { filterKey, source, names: computeNames() };
}

export const listUtils = { cap, freezeRows };

export type CappedList<T> = { visible: T[]; hiddenCount: number };

export type FrozenRows<S> = { filterKey: string; source: S; names: string[] };
