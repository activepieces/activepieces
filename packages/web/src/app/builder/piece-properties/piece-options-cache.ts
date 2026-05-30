import {
  DropdownState,
  PiecePropertyMap,
} from '@activepieces/pieces-framework';

const MAX_ENTRIES = 200;

function createOptionsCache<T>(isCacheable: (value: T) => boolean) {
  const cache = new Map<string, T>();

  function get(key: PieceOptionsCacheKey): T | undefined {
    return cache.get(JSON.stringify(key));
  }

  function set(key: PieceOptionsCacheKey, value: T): void {
    if (!isCacheable(value)) {
      return;
    }
    const serializedKey = JSON.stringify(key);
    // Re-insert to mark most-recently-used, then evict the oldest over the cap.
    if (cache.has(serializedKey)) {
      cache.delete(serializedKey);
    }
    cache.set(serializedKey, value);
    if (cache.size > MAX_ENTRIES) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) {
        cache.delete(oldest);
      }
    }
  }

  return { get, set };
}

// Never cache the disabled "Connection expired / Failed to load" placeholder states or empty
// results - only successful, populated lists - so a transient error can't get stuck in the cache.
export const dropdownOptionsCache = createOptionsCache<DropdownState<unknown>>(
  (state) =>
    !state.disabled && Array.isArray(state.options) && state.options.length > 0,
);

export const dynamicPropsCache = createOptionsCache<PiecePropertyMap>(
  (propertyMap) => !!propertyMap && Object.keys(propertyMap).length > 0,
);

export type PieceOptionsCacheKey = {
  projectId: string;
  pieceName: string;
  pieceVersion: string;
  propertyName: string;
  actionOrTriggerName: string;
  input: Record<string, unknown>;
  searchValue?: string;
};
