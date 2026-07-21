import { t } from 'i18next';
import { useCallback, useRef } from 'react';

// Resolves a Stage resource's display name WITHOUT ever downgrading to a worse
// value mid-navigation. The flow/table queries have a short (or zero) staleTime,
// so right after navigating the live name is briefly undefined — without this the
// chip flashes the bare type ("table") before the real name loads. We remember
// the last good name per resource identity so re-visits and refetch gaps stay
// stable, and fall back to a humanized type label only on a true first load.
export function useStableResourceName() {
  const cacheRef = useRef<Map<string, string>>(new Map());
  return useCallback(
    (input: { type: string; id?: string; liveName?: string }): string =>
      stableNameUtils.resolve({ cache: cacheRef.current, ...input }),
    [],
  );
}

// Pure resolution + cache write, extracted so it can be unit-tested without React.
function resolve({
  cache,
  type,
  id,
  liveName,
}: {
  cache: Map<string, string>;
  type: string;
  id?: string;
  liveName?: string;
}): string {
  const key = id ? `${type}:${id}` : type;
  const trimmed = liveName?.trim();
  if (trimmed) {
    cache.set(key, trimmed);
    return trimmed;
  }
  return cache.get(key) ?? humanizeType(type);
}

function humanizeType(type: string): string {
  switch (type) {
    case 'flow':
      return t('Automation');
    case 'table':
      return t('Table');
    case 'run':
      return t('Run');
    case 'release':
      return t('Release');
    case 'runs':
      return t('Runs');
    case 'connections':
      return t('Connections');
    case 'variables':
      return t('Variables');
    case 'releases':
      return t('Releases');
    case 'settings':
      return t('Settings');
    case 'automations':
      return t('Automations');
    default:
      return type;
  }
}

export const stableNameUtils = {
  resolve,
  humanizeType,
};
